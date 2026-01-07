#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Test Execution MCP Server
 * Runs Playwright/Cucumber tests and reports results
 */
class TestExecutionMCPServer {
  private server: Server;
  private projectPath: string;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
    this.server = new Server(
      {
        name: 'test-execution-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();

    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'run_tests',
          description: 'Execute Cucumber/Playwright tests',
          inputSchema: {
            type: 'object',
            properties: {
              feature: {
                type: 'string',
                description: 'Specific feature file to run (optional)',
              },
              tags: {
                type: 'string',
                description: 'Cucumber tags to filter tests (e.g., @smoke)',
              },
              dryRun: {
                type: 'boolean',
                description: 'Run in dry-run mode to check for undefined steps',
                default: false,
              },
            },
          },
        },
        {
          name: 'get_test_results',
          description: 'Get results from the last test run',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'validate_steps',
          description: 'Check for undefined step definitions',
          inputSchema: {
            type: 'object',
            properties: {
              feature: {
                type: 'string',
                description: 'Specific feature file to validate',
              },
            },
          },
        },
        {
          name: 'generate_step_snippets',
          description: 'Generate boilerplate code for undefined steps',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'run_tests':
            return await this.runTests(
              args?.feature as string,
              args?.tags as string,
              args?.dryRun as boolean,
            );

          case 'get_test_results':
            return await this.getTestResults();

          case 'validate_steps':
            return await this.validateSteps(args?.feature as string);

          case 'generate_step_snippets':
            return await this.generateStepSnippets();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async runTests(
    feature?: string,
    tags?: string,
    dryRun: boolean = false,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    return new Promise((resolve) => {
      const args = ['run', 'cucumber'];

      if (feature) args.push(feature);
      if (tags) args.push('--tags', tags);
      if (dryRun) args.push('--dry-run');

      let output = '';
      let errorOutput = '';
      let timedOut = false;

      const proc = spawn('npm', args, {
        cwd: this.projectPath,
        shell: false, // Fixed: Use false to avoid security warning
      });

      // Set 5-minute timeout to prevent hanging processes
      const timeout = setTimeout(
        () => {
          timedOut = true;
          proc.kill('SIGTERM');
        },
        5 * 60 * 1000,
      );

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      proc.on('close', (code) => {
        clearTimeout(timeout);

        // Truncate output if it exceeds 100KB to prevent memory issues
        const maxSize = 100 * 1024;
        const truncatedOutput =
          output.length > maxSize
            ? `[Output truncated - original size: ${output.length} bytes]\n...\n${output.substring(output.length - maxSize)}`
            : output;

        const result = {
          exitCode: code,
          output: truncatedOutput,
          errors: errorOutput,
          success: code === 0,
          timedOut,
          dryRun,
          outputSize: output.length,
        };

        resolve({
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        });
      });
    });
  }

  private async getTestResults(): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      const reportPath = join(this.projectPath, 'reports', 'cucumber-report.json');

      if (!existsSync(reportPath)) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: 'No test results found. Run tests first.' }),
            },
          ],
        };
      }

      const report = JSON.parse(readFileSync(reportPath, 'utf-8'));

      const summary = {
        features: report.length,
        scenarios: {
          total: 0,
          passed: 0,
          failed: 0,
          undefined: 0,
          skipped: 0,
        },
        steps: {
          total: 0,
          passed: 0,
          failed: 0,
          undefined: 0,
          skipped: 0,
        },
      };

      report.forEach((feature: any) => {
        feature.elements?.forEach((scenario: any) => {
          summary.scenarios.total++;

          scenario.steps?.forEach((step: any) => {
            summary.steps.total++;
            const status = step.result?.status || 'undefined';

            if (status === 'passed') summary.steps.passed++;
            else if (status === 'failed') summary.steps.failed++;
            else if (status === 'undefined') summary.steps.undefined++;
            else if (status === 'skipped') summary.steps.skipped++;
          });

          // Determine scenario status
          const hasUndefined = scenario.steps?.some((s: any) => s.result?.status === 'undefined');
          const hasFailed = scenario.steps?.some((s: any) => s.result?.status === 'failed');

          if (hasUndefined) summary.scenarios.undefined++;
          else if (hasFailed) summary.scenarios.failed++;
          else summary.scenarios.passed++;
        });
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ summary, timestamp: new Date().toISOString() }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get test results: ${error}`);
    }
  }

  private async validateSteps(
    feature?: string,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    return new Promise((resolve) => {
      const args = ['run', 'steps-usage'];
      if (feature) args.push(feature);

      let output = '';
      let timedOut = false;

      const proc = spawn('npm', args, {
        cwd: this.projectPath,
        shell: false, // Fixed: Use false to avoid security warning
      });

      // Set 2-minute timeout for step validation
      const timeout = setTimeout(
        () => {
          timedOut = true;
          proc.kill('SIGTERM');
        },
        2 * 60 * 1000,
      );

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.on('close', () => {
        clearTimeout(timeout);

        const undefinedSteps = output
          .split('\n')
          .filter((line) => line.includes('undefined'))
          .map((line) => line.trim());

        resolve({
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  undefinedSteps,
                  count: undefinedSteps.length,
                  allStepsDefined: undefinedSteps.length === 0,
                  timedOut,
                },
                null,
                2,
              ),
            },
          ],
        });
      });
    });
  }

  private async generateStepSnippets(): Promise<{
    content: Array<{ type: string; text: string }>;
  }> {
    return new Promise((resolve) => {
      let output = '';
      let timedOut = false;

      const proc = spawn('npm', ['run', 'snippets'], {
        cwd: this.projectPath,
        shell: false, // Fixed: Use false to avoid security warning
      });

      // Set 2-minute timeout for snippet generation
      const timeout = setTimeout(
        () => {
          timedOut = true;
          proc.kill('SIGTERM');
        },
        2 * 60 * 1000,
      );

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.on('close', () => {
        clearTimeout(timeout);

        resolve({
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  snippets: output || 'No undefined steps found',
                  timedOut,
                },
                null,
                2,
              ),
            },
          ],
        });
      });
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Test Execution MCP server running on stdio');
  }
}

// Start server
const server = new TestExecutionMCPServer();
server.run().catch(console.error);
