#!/usr/bin/env node
/**
 * Gemini Hook: before-agent
 * Injects YARD context before each agent invocation.
 */
'use strict';

async function main() {
  try {
    // Context injection logic
    process.exit(0);
  } catch (err) {
    process.stderr.write(`[yard:before-agent] ${err.message}\n`);
    process.exit(0); // Non-fatal
  }
}

main();
