#!/usr/bin/env node
/**
 * IDS Pre-Push Hook
 *
 * Incremental registry update - called by pre-push git hook.
 * Uses RegistryUpdater.processChanges() to incrementally update the service registry.
 *
 * @module hooks/ids-pre-push
 */
'use strict';

const path = require('path');

async function main() {
  try {
    const { RegistryUpdater } = require('../core/registry/registry-updater');
    const updater = new RegistryUpdater(process.cwd());
    await updater.processChanges({ incremental: true });
    process.exit(0);
  } catch (err) {
    // Non-fatal: don't block push
    process.stderr.write(`[IDS] Registry update warning: ${err.message}\n`);
    process.exit(0);
  }
}

main();
