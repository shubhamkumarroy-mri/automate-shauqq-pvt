#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { execSync } from 'child_process';

/**
 * GitHub MCP Server
 * Monitors repository changes, detects PR modifications, and provides Git context
 */
class GitHubMCPServer {
  private server: Server;
  private repoPath: string;

  constructor(repoPath: string = process.cwd()) {
    this.repoPath = repoPath;
    this.server = new Server(
      {
        name: 'github-mcp-server',
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
    process.on('SIGINT', () => {
      void (async () => {
        await this.server.close();
        process.exit(0);
      })();
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: [
        {
          name: 'get_changed_files',
          description: 'Get list of changed files in the repository (staged, unstaged, or all)',
          inputSchema: {
            type: 'object',
            properties: {
              state: {
                type: 'string',
                enum: ['staged', 'unstaged', 'all'],
                description: 'Filter by git state',
                default: 'all'
              }
            }
          }
        },
        {
          name: 'get_file_diff',
          description: 'Get diff for a specific file',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Relative path to the file'
              },
              staged: {
                type: 'boolean',
                description: 'Get staged diff (vs unstaged)',
                default: false
              }
            },
            required: ['filePath']
          }
        },
        {
          name: 'detect_feature_changes',
          description: 'Detect changes in Gherkin feature files and identify undefined steps',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'get_commit_history',
          description: 'Get recent commit history',
          inputSchema: {
            type: 'object',
            properties: {
              count: {
                type: 'number',
                description: 'Number of commits to retrieve',
                default: 10
              }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_changed_files':
            return this.getChangedFiles(args?.state as string);

          case 'get_file_diff':
            return this.getFileDiff(args?.filePath as string, args?.staged as boolean);

          case 'detect_feature_changes':
            return this.detectFeatureChanges();

          case 'get_commit_history':
            return this.getCommitHistory(args?.count as number);

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

  private getChangedFiles(state = 'all') {
    try {
      const cmd = 'git status --porcelain';
      const output = execSync(cmd, { cwd: this.repoPath, encoding: 'utf-8' });

      const files = output
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => {
          const status = line.substring(0, 2);
          const filePath = line.substring(3);
          const staged = !status.startsWith(' ') && !status.startsWith('?');
          const unstaged = status[1] !== ' ';

          return { filePath, status, staged, unstaged };
        });

      const filtered = files.filter(
        (f: { filePath: string; status: string; staged: boolean; unstaged: boolean }) => {
          if (state === 'staged') return f.staged;
          if (state === 'unstaged') return f.unstaged;
          return true;
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ files: filtered, count: filtered.length }, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get changed files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getFileDiff(filePath: string, staged = false) {
    try {
      const cmd = staged ? `git diff --cached "${filePath}"` : `git diff "${filePath}"`;

      const diff = execSync(cmd, { cwd: this.repoPath, encoding: 'utf-8' });

      return {
        content: [
          {
            type: 'text',
            text: diff || 'No changes detected'
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get diff for ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private detectFeatureChanges() {
    try {
      // Get all changed .feature files
      const statusOutput = execSync('git status --porcelain', {
        cwd: this.repoPath,
        encoding: 'utf-8'
      });

      const featureFiles = statusOutput
        .split('\n')
        .filter((line: string) => line.includes('.feature'))
        .map((line: string) => line.substring(3).trim());

      const changes = [];

      for (const file of featureFiles) {
        try {
          const diff = execSync(`git diff "${file}"`, {
            cwd: this.repoPath,
            encoding: 'utf-8'
          });

          // Extract new Given/When/Then steps
          const newSteps = diff
            .split('\n')
            .filter(
              (line: string) =>
                line.startsWith('+') && /^\+\s*(Given|When|Then|And|But)/.test(line)
            )
            .map((line: string) => line.substring(1).trim());

          if (newSteps.length > 0) {
            changes.push({
              file,
              newSteps,
              diff: diff.substring(0, 500) // Truncate for readability
            });
          }
        } catch {
          // File might be new
          continue;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                featureFiles,
                changes,
                requiresAttention: changes.length > 0
              },
              null,
              2
            )
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to detect feature changes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getCommitHistory(count = 10) {
    try {
      const log = execSync(`git log -${count} --pretty=format:"%H|%an|%ae|%ad|%s"`, {
        cwd: this.repoPath,
        encoding: 'utf-8'
      });

      const commits = log.split('\n').map((line: string) => {
        const [hash, author, email, date, message] = line.split('|');
        return { hash, author, email, date, message };
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ commits, count: commits.length }, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get commit history: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('GitHub MCP server running on stdio');
  }
}

// Start server
const server = new GitHubMCPServer();
server.run().catch(console.error);
