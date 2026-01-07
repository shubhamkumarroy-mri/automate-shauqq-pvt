#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

/**
 * Specification MCP Server
 * Parses Gherkin files, extracts scenarios, and validates BDD specifications
 */
class SpecificationMCPServer {
  private server: Server;
  private projectPath: string;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
    this.server = new Server(
      {
        name: 'specification-mcp-server',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupToolHandlers();

    this.server.onerror = error => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_features',
          description: 'List all Gherkin feature files in the project',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'parse_feature',
          description: 'Parse a specific feature file and extract scenarios',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Relative path to the feature file'
              }
            },
            required: ['filePath']
          }
        },
        {
          name: 'extract_steps',
          description: 'Extract all Given/When/Then steps from features',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Specific feature file (optional)'
              }
            }
          }
        },
        {
          name: 'analyze_coverage',
          description: 'Analyze which scenarios have complete step definitions',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_features':
            return await this.listFeatures();

          case 'parse_feature':
            return await this.parseFeature(args?.filePath as string);

          case 'extract_steps':
            return await this.extractSteps(args?.filePath as string);

          case 'analyze_coverage':
            return await this.analyzeCoverage();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });
  }

  private async listFeatures() {
    const featuresDir = join(this.projectPath, 'features');
    const files = this.findFeatureFiles(featuresDir);

    const features = files.map(file => ({
      path: relative(this.projectPath, file),
      name: file.split('/').pop()
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ features, count: features.length }, null, 2)
        }
      ]
    };
  }

  private findFeatureFiles(dir: string): string[] {
    let results: string[] = [];

    try {
      const list = readdirSync(dir);

      list.forEach((file) => {
        const filePath = join(dir, file);
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
          results = results.concat(this.findFeatureFiles(filePath));
        } else if (file.endsWith('.feature')) {
          results.push(filePath);
        }
      });
    } catch {
      // Directory might not exist
    }

    return results;
  }

  private async parseFeature(filePath: string) {
    try {
      const fullPath = join(this.projectPath, filePath);
      const content = readFileSync(fullPath, 'utf-8');

      const lines = content.split('\n');
      const feature = {
        name: '',
        description: '',
        background: [] as string[],
        scenarios: [] as any[],
        tags: [] as string[]
      };

      let currentSection: 'feature' | 'background' | 'scenario' | null = null;
      let currentScenario: any = null;

      lines.forEach((line, index) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('@')) {
          const tags = trimmed.split(/\s+/).filter(t => t.startsWith('@'));
          if (!currentScenario) {
            feature.tags.push(...tags);
          } else {
            currentScenario.tags.push(...tags);
          }
        } else if (trimmed.startsWith('Feature:')) {
          feature.name = trimmed.substring(8).trim();
          currentSection = 'feature';
        } else if (trimmed.startsWith('Background:')) {
          currentSection = 'background';
        } else if (trimmed.startsWith('Scenario:') || trimmed.startsWith('Scenario Outline:')) {
          const isOutline = trimmed.startsWith('Scenario Outline:');
          currentScenario = {
            name: trimmed.substring(isOutline ? 17 : 9).trim(),
            type: isOutline ? 'outline' : 'scenario',
            tags: [],
            steps: [],
            line: index + 1
          };
          feature.scenarios.push(currentScenario);
          currentSection = 'scenario';
        } else if (/^(Given|When|Then|And|But)\s/.exec(trimmed)) {
          const step = trimmed;
          if (currentSection === 'background') {
            feature.background.push(step);
          } else if (currentSection === 'scenario' && currentScenario) {
            currentScenario.steps.push(step);
          }
        } else if (currentSection === 'feature' && trimmed && !trimmed.startsWith('#')) {
          feature.description += trimmed + ' ';
        }
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                filePath,
                feature,
                totalScenarios: feature.scenarios.length,
                totalSteps: feature.scenarios.reduce((sum, s) => sum + s.steps.length, 0)
              },
              null,
              2
            )
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to parse feature: ${error}`);
    }
  }

  private async extractSteps(filePath?: string) {
    const files = filePath
      ? [join(this.projectPath, filePath)]
      : this.findFeatureFiles(join(this.projectPath, 'features'));

    const allSteps = new Set<string>();
    const stepsByType: Record<string, Set<string>> = {
      Given: new Set(),
      When: new Set(),
      Then: new Set(),
      And: new Set(),
      But: new Set()
    };

    files.forEach((file) => {
      try {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line) => {
          const trimmed = line.trim();
          const match = /^(Given|When|Then|And|But)\s+(.+)/.exec(trimmed);

          if (match) {
            const [, type, step] = match;
            allSteps.add(trimmed);
            stepsByType[type].add(step);
          }
        });
      } catch {
        // Skip file on error
      }
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              totalSteps: allSteps.size,
              steps: Array.from(allSteps),
              byType: {
                Given: Array.from(stepsByType.Given),
                When: Array.from(stepsByType.When),
                Then: Array.from(stepsByType.Then),
                And: Array.from(stepsByType.And),
                But: Array.from(stepsByType.But)
              }
            },
            null,
            2
          )
        }
      ]
    };
  }

  private async analyzeCoverage() {
    try {
      // Get all step definitions from src/steps/*.ts files
      const definedSteps = this.extractDefinedSteps();

      // Get all steps from feature files
      const featureSteps = await this.extractSteps();
      const featureStepStrings = JSON.parse(featureSteps.content[0].text).steps || [];

      // Parse step definitions (remove regex patterns and return the pattern text)
      const definedPatterns = definedSteps.map(step => step.pattern);

      // Find undefined steps
      const undefinedSteps: string[] = [];
      const definedFeatureSteps: string[] = [];

      featureStepStrings.forEach((featureStep: string) => {
        const stepText = featureStep.replace(/^(Given|When|Then|And|But)\s+/, '').trim();
        const isDefined = definedPatterns.some((pattern) => {
          try {
            return new RegExp(pattern).test(stepText);
          } catch {
            return pattern.includes(stepText) || stepText.includes(pattern);
          }
        });

        if (isDefined) {
          definedFeatureSteps.push(featureStep);
        } else {
          undefinedSteps.push(featureStep);
        }
      });

      const coverage = {
        totalSteps: featureStepStrings.length,
        definedSteps: definedFeatureSteps.length,
        undefinedSteps: undefinedSteps.length,
        coveragePercentage:
          featureStepStrings.length > 0
            ? Math.round((definedFeatureSteps.length / featureStepStrings.length) * 100)
            : 100,
        undefined: undefinedSteps,
        defined: definedPatterns.length
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(coverage, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to analyze coverage: ${error}`);
    }
  }

  private extractDefinedSteps(): { pattern: string; type: string }[] {
    const stepsDir = join(this.projectPath, 'src', 'steps');
    const steps: { pattern: string; type: string }[] = [];

    try {
      const files = readdirSync(stepsDir).filter(f => f.endsWith('.ts'));

      files.forEach((file) => {
        try {
          const content = readFileSync(join(stepsDir, file), 'utf-8');
          const lines = content.split('\n');

          lines.forEach((line) => {
            // Match patterns like: Given('pattern', ...)
            const match = /(Given|When|Then|And|But)\s*\(\s*['"]([^'"]+)['"]/.exec(line);
            if (match) {
              const [, type, pattern] = match;
              // Convert Cucumber expressions to regex patterns
              const regexPattern = this.cucumberExpressionToRegex(pattern);
              steps.push({ pattern: regexPattern, type });
            }
          });
        } catch {
          // Skip file on error
        }
      });
    } catch {
      // Steps directory might not exist
    }

    return steps;
  }

  /**
   * Convert Cucumber expression to regex pattern
   * Handles common parameter types: {string}, {int}, {float}, {word}
   */
  private cucumberExpressionToRegex(pattern: string): string {
    // Escape special regex characters except for Cucumber parameters
    const regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
      .replace(/\\\{string\\\}/g, '.*?') // {string} -> match any text
      .replace(/\\\{int\\\}/g, '-?\\d+') // {int} -> match integers
      .replace(/\\\{float\\\}/g, '-?\\d+\\.?\\d*') // {float} -> match decimals
      .replace(/\\\{word\\\}/g, '\\w+') // {word} -> match word chars
      .replace(/\\\{\\}/g, '.*?'); // {} -> match anything

    return regexPattern;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Specification MCP server running on stdio');
  }
}

// Start server
const server = new SpecificationMCPServer();
server.run().catch(console.error);
