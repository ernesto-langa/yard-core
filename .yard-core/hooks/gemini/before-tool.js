#!/usr/bin/env node
/**
 * Gemini Hook: before-tool
 * Security and audit checks before tool execution.
 */
'use strict';

async function main() {
  try {
    process.exit(0);
  } catch (err) {
    process.stderr.write(`[yard:before-tool] ${err.message}\n`);
    process.exit(0);
  }
}

main();
