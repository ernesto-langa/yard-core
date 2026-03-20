/**
 * cli/commands/mcp/index.js
 * Entry point for Model Context Protocol (MCP) CLI commands.
 *
 * Architecture: Centralized server configuration.
 * MCP servers are configured once at ~/.yard/mcp/ and shared across
 * all projects via symlinks (Unix) or junctions (Windows).
 *
 * Quick-start:
 *   yard mcp setup --with-defaults   # Initialize global config
 *   yard mcp link                     # Link current project
 *   yard mcp status                   # Show current status
 *   yard mcp add <name>               # Add a server
 *
 * @version 1.0.0
 * @story 2.11 (MCP System Global)
 */

'use strict';

const { Command } = require('commander');
const { createSetupCommand } = require('./setup');
const { createLinkCommand } = require('./link');
const { createStatusCommand } = require('./status');
const { createAddCommand } = require('./add');

/**
 * Creates and returns the `yard mcp` command with all subcommands.
 *
 * @returns {Command}
 */
function createMcpCommand() {
  const cmd = new Command('mcp')
    .description('Manage MCP (Model Context Protocol) server configuration')
    .addHelpText(
      'after',
      `
Benefits of the global MCP architecture:
  • Single configuration point — configure once, use everywhere
  • No duplication across projects
  • Simplified maintenance and updates

Workflow:
  1. yard mcp setup --with-defaults     Initialize global ~/.yard/mcp/
  2. yard mcp link                       Link current project to global config
  3. yard mcp add context7               Add additional servers as needed
  4. yard mcp status                     Verify configuration

Examples:
  $ yard mcp setup --with-defaults
  $ yard mcp setup --servers context7,exa,github
  $ yard mcp link --migrate
  $ yard mcp link --merge
  $ yard mcp add context7
  $ yard mcp add myserver --url https://my-sse-server.example.com
  $ yard mcp status --json
  $ yard mcp status --verbose
`
    );

  cmd.addCommand(createSetupCommand());
  cmd.addCommand(createLinkCommand());
  cmd.addCommand(createStatusCommand());
  cmd.addCommand(createAddCommand());

  return cmd;
}

module.exports = { createMcpCommand };
