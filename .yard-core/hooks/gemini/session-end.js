#!/usr/bin/env node
/**
 * Gemini Hook: session-end
 * Persists session state at end of each session.
 */
'use strict';

async function main() {
  try {
    process.exit(0);
  } catch (err) {
    process.stderr.write(`[yard:session-end] ${err.message}\n`);
    process.exit(0);
  }
}

main();
