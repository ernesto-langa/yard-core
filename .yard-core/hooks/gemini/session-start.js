#!/usr/bin/env node
/**
 * Gemini Hook: session-start
 * Initializes YARD session context at the start of each Gemini session.
 */
'use strict';

const path = require('path');

async function main() {
  try {
    const projectRoot = process.cwd();
    // Session initialization logic
    process.exit(0);
  } catch (err) {
    process.stderr.write(`[yard:session-start] ${err.message}\n`);
    process.exit(0); // Non-fatal
  }
}

main();
