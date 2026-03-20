/**
 * precompact-runner.js
 * Session digest trigger for Claude Code's context compaction process.
 *
 * Architecture: Open Core model
 *   - yard-core: hook runner + pro detection logic (this file)
 *   - yard-pro:  actual digest extraction (memory/session-digest/extractor.js)
 *
 * Uses fire-and-forget async execution to avoid blocking the compact operation.
 * Never throws exceptions that would interrupt user workflows.
 *
 * @version 1.0.0
 * @story MIS-3
 */

'use strict';

const path = require('path');
const proDetector = require(path.join(__dirname, '../../../../bin/utils/pro-detector'));

/**
 * PreCompact hook handler.
 * Triggers async digest extraction without blocking the compact operation.
 *
 * @param {Object} context
 * @returns {Promise<void>}
 */
async function onPreCompact(context) {
  try {
    const available = proDetector.isProAvailable();

    if (!available) {
      console.log('[PreCompact] aiox-pro not available, skipping session digest');
      return;
    }

    // Fire-and-forget: trigger digest extraction asynchronously
    setImmediate(async () => {
      try {
        const extractor = proDetector.loadProModule('memory/session-digest/extractor.js');

        if (!extractor || typeof extractor.extractSessionDigest !== 'function') {
          return;
        }

        await extractor.extractSessionDigest(context);
      } catch (err) {
        try {
          console.error('[PreCompact] Digest extraction failed silently:', err.message);
        } catch {
          // Absolute silent failure
        }
      }
    });
  } catch (err) {
    console.error('[PreCompact] Hook runner error:', err.message);
  }
}

/**
 * Hook configuration for Claude Code integration.
 *
 * @returns {Object}
 */
function getHookConfig() {
  return {
    name: 'precompact-session-digest',
    event: 'PreCompact',
    handler: onPreCompact,
    timeout: 5000,
    description: 'MIS-3: Session digest extraction before context compaction',
  };
}

module.exports = { onPreCompact, getHookConfig };
