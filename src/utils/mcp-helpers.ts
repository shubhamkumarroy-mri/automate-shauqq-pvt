import { ICustomWorld } from '../support/custom-world';
import { z } from 'zod';

/**
 * MCP Utility Helpers
 * Provides convenient methods for interacting with MCP servers in test steps
 */

/**
 * Call a tool on an MCP server
 * @param world - The Cucumber world instance
 * @param server - The server to call ('github' | 'specification' | 'testExecution')
 * @param toolName - The name of the tool to call
 * @param args - Arguments to pass to the tool
 * @returns The tool response
 */
export async function callMcpTool(
  world: ICustomWorld,
  server: 'github' | 'specification' | 'testExecution',
  toolName: string,
  args?: Record<string, any>,
): Promise<any> {
  const client = world.mcpClients?.[server];

  if (!client) {
    throw new Error(
      `MCP client '${server}' is not available. Ensure MCP servers are initialized in hooks.`,
    );
  }

  try {
    const response = await client.request(
      {
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args || {},
        },
      },
      z.any(),
    );

    return response;
  } catch (error) {
    throw new Error(`Failed to call MCP tool '${toolName}' on server '${server}': ${error}`);
  }
}

/**
 * Get changed files from GitHub server
 * @param world - The Cucumber world instance
 * @param state - Filter by state: 'staged' | 'unstaged' | 'all'
 * @returns List of changed files
 */
export async function getChangedFiles(
  world: ICustomWorld,
  state: 'staged' | 'unstaged' | 'all' = 'all',
): Promise<any> {
  const response = await callMcpTool(world, 'github', 'get_changed_files', { state });

  if (response.content && response.content[0]) {
    return JSON.parse(response.content[0].text);
  }

  return { files: [], count: 0 };
}

/**
 * Get file diff from GitHub server
 * @param world - The Cucumber world instance
 * @param filePath - Relative path to the file
 * @param staged - Get staged diff (vs unstaged)
 * @returns File diff
 */
export async function getFileDiff(
  world: ICustomWorld,
  filePath: string,
  staged: boolean = false,
): Promise<string> {
  const response = await callMcpTool(world, 'github', 'get_file_diff', { filePath, staged });

  if (response.content && response.content[0]) {
    return response.content[0].text;
  }

  return '';
}

/**
 * List all feature files in the project
 * @param world - The Cucumber world instance
 * @returns List of feature files
 */
export async function listFeatures(world: ICustomWorld): Promise<any> {
  const response = await callMcpTool(world, 'specification', 'list_features');

  if (response.content && response.content[0]) {
    return JSON.parse(response.content[0].text);
  }

  return { features: [], count: 0 };
}

/**
 * Parse a feature file and extract scenarios
 * @param world - The Cucumber world instance
 * @param filePath - Relative path to the feature file
 * @returns Parsed feature data
 */
export async function parseFeature(world: ICustomWorld, filePath: string): Promise<any> {
  const response = await callMcpTool(world, 'specification', 'parse_feature', { filePath });

  if (response.content && response.content[0]) {
    return JSON.parse(response.content[0].text);
  }

  return null;
}

/**
 * Analyze step definition coverage
 * @param world - The Cucumber world instance
 * @returns Coverage analysis
 */
export async function analyzeCoverage(world: ICustomWorld): Promise<any> {
  const response = await callMcpTool(world, 'specification', 'analyze_coverage');

  if (response.content && response.content[0]) {
    return JSON.parse(response.content[0].text);
  }

  return null;
}

/**
 * Run tests via MCP server
 * @param world - The Cucumber world instance
 * @param options - Test execution options
 * @returns Test results
 */
export async function runTests(
  world: ICustomWorld,
  options?: { feature?: string; tags?: string; dryRun?: boolean },
): Promise<any> {
  const response = await callMcpTool(world, 'testExecution', 'run_tests', options);

  if (response.content && response.content[0]) {
    return JSON.parse(response.content[0].text);
  }

  return null;
}

/**
 * Validate step definitions
 * @param world - The Cucumber world instance
 * @param feature - Optional feature file to validate
 * @returns Validation results
 */
export async function validateSteps(world: ICustomWorld, feature?: string): Promise<any> {
  const response = await callMcpTool(world, 'testExecution', 'validate_steps', { feature });

  if (response.content && response.content[0]) {
    return JSON.parse(response.content[0].text);
  }

  return null;
}

/**
 * Get test results from the last run
 * @param world - The Cucumber world instance
 * @returns Test results
 */
export async function getTestResults(world: ICustomWorld): Promise<any> {
  const response = await callMcpTool(world, 'testExecution', 'get_test_results');

  if (response.content && response.content[0]) {
    return JSON.parse(response.content[0].text);
  }

  return null;
}
