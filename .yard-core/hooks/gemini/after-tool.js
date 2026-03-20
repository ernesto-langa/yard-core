#!/usr/bin/env node
/**
 * Gemini Hook: after-tool
 * Post-tool audit logging.
 */
'use strict';

async function main() {
  try {
    process.exit(0);
  } catch (err) {
    process.stderr.write(`[yard:after-tool] ${err.message}\n`);
    process.exit(0);
  }
}

main();
