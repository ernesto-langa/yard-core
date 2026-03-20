/**
 * hook-interface.js
 * Cross-CLI abstraction layer enabling hooks to function on both
 * Claude Code and Gemini CLI platforms.
 *
 * @version 1.0.0
 */

'use strict';

/**
 * Maps YARD standard events to platform-specific counterparts.
 */
const EVENT_MAPPING = {
  sessionStart: {
    claude: null,
    gemini: 'SessionStart',
  },
  beforeAgent: {
    claude: 'PreToolUse',
    gemini: 'BeforeAgent',
  },
  afterAgent: {
    claude: 'PostToolUse',
    gemini: 'AfterAgent',
  },
  beforeTool: {
    claude: 'PreToolUse',
    gemini: 'BeforeTool',
  },
  afterTool: {
    claude: 'PostToolUse',
    gemini: 'AfterTool',
  },
  sessionEnd: {
    claude: 'Stop',
    gemini: 'SessionEnd',
  },
  preCompact: {
    claude: 'PreCompact',
    gemini: 'BeforeCompact',
  },
  onError: {
    claude: 'OnError',
    gemini: 'OnError',
  },
};

/**
 * Base class for unified hook implementations.
 */
class UnifiedHook {
  /**
   * @param {Object} config
   * @param {string} config.name - Hook name
   * @param {string} config.event - YARD standard event type
   * @param {string} [config.matcher] - Tool name patterns to match (default '*')
   * @param {number} [config.timeout] - Max execution time in ms
   */
  constructor(config) {
    this.name = config.name;
    this.event = config.event;
    this.matcher = config.matcher || '*';
    this.timeout = config.timeout || 5000;
  }

  /**
   * Execute the hook. Must be implemented by subclasses.
   * @param {Object} context
   * @returns {Promise<Object>}
   */
  async execute(context) {
    throw new Error('execute() must be implemented by subclass');
  }

  /**
   * Generate Claude Code hook configuration.
   * @returns {null}
   */
  toClaudeConfig() {
    return null;
  }

  /**
   * Generate Gemini CLI hook configuration.
   * @returns {null}
   */
  toGeminiConfig() {
    return null;
  }
}

/**
 * Constructs execution context for a given provider.
 *
 * @param {string} provider - 'claude' or 'gemini'
 * @returns {Object} HookContext
 */
function createContext(provider) {
  const projectDir = provider === 'gemini'
    ? (process.env.GEMINI_PROJECT_DIR || process.cwd())
    : (process.env.YARD_PROJECT_DIR || process.cwd());

  return {
    projectDir,
    sessionId: process.env.CLAUDE_SESSION_ID
      || process.env.GEMINI_SESSION_ID
      || `session-${Date.now()}`,
    toolMeta: {},
    provider,
  };
}

/**
 * Transforms hook results into provider-specific JSON strings.
 *
 * @param {Object} result
 * @param {'claude'|'gemini'} provider
 * @returns {string} JSON string
 */
function formatResult(result, provider) {
  if (provider === 'gemini') {
    return JSON.stringify({
      status: result.status === 'allow' ? 'success' : result.status,
      message: result.message,
      contextInjection: result.contextInjection,
    });
  }

  // Claude format
  return JSON.stringify({
    continue: result.status !== 'block',
    message: result.message,
    context: result.contextInjection,
  });
}

module.exports = { UnifiedHook, EVENT_MAPPING, createContext, formatResult };
