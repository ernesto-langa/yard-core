// File: common/utils/status-mapper.js

/**
 * Status Mapper - Bidirectional status mapping between YARD and ClickUp
 *
 * This module provides utilities for:
 * - Mapping YARD story statuses to ClickUp custom field values
 * - Mapping ClickUp story-status values back to YARD statuses
 * - Handling ClickUp-specific statuses (e.g., "Ready for Dev")
 *
 * CRITICAL: Stories use ClickUp custom field "story-status", NOT native status.
 * Epics use the native ClickUp status field (Planning, In Progress, Done).
 */

const STATUS_MAPPING = {
  YARD_TO_CLICKUP: {
    'Draft': 'Draft',
    'Ready for Review': 'Ready for Review',
    'Review': 'Review',
    'In Progress': 'In Progress',
    'Done': 'Done',
    'Blocked': 'Blocked',
  },
  CLICKUP_TO_YARD: {
    'Draft': 'Draft',
    'Ready for Dev': 'Ready for Review',  // ClickUp-specific status
    'Ready for Review': 'Ready for Review',
    'Review': 'Review',
    'In Progress': 'In Progress',
    'Done': 'Done',
    'Blocked': 'Blocked',
  },
};

/**
 * Maps an YARD story status to ClickUp story-status custom field value
 *
 * @param {string} yardStatus - Local .md file status
 * @returns {string} ClickUp story-status value
 */
function mapStatusToClickUp(yardStatus) {
  const mapped = STATUS_MAPPING.YARD_TO_CLICKUP[yardStatus];

  if (!mapped) {
    console.warn(`Unknown YARD status: ${yardStatus}, using as-is`);
    return yardStatus;
  }

  return mapped;
}

/**
 * Maps a ClickUp story-status custom field value to YARD story status
 *
 * @param {string} clickupStatus - ClickUp story-status value
 * @returns {string} Local .md file status
 */
function mapStatusFromClickUp(clickupStatus) {
  const mapped = STATUS_MAPPING.CLICKUP_TO_YARD[clickupStatus];

  if (!mapped) {
    console.warn(`Unknown ClickUp status: ${clickupStatus}, using as-is`);
    return clickupStatus;
  }

  return mapped;
}

/**
 * Validates if a status is a valid YARD story status
 *
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid
 */
function isValidYARDStatus(status) {
  return Object.keys(STATUS_MAPPING.YARD_TO_CLICKUP).includes(status);
}

/**
 * Validates if a status is a valid ClickUp story-status value
 *
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid
 */
function isValidClickUpStatus(status) {
  return Object.keys(STATUS_MAPPING.CLICKUP_TO_YARD).includes(status);
}

/**
 * Gets all valid YARD story statuses
 *
 * @returns {string[]} Array of valid statuses
 */
function getValidYARDStatuses() {
  return Object.keys(STATUS_MAPPING.YARD_TO_CLICKUP);
}

/**
 * Gets all valid ClickUp story-status values
 *
 * @returns {string[]} Array of valid statuses
 */
function getValidClickUpStatuses() {
  return Object.keys(STATUS_MAPPING.CLICKUP_TO_YARD);
}

module.exports = {
  mapStatusToClickUp,
  mapStatusFromClickUp,
  isValidYARDStatus,
  isValidClickUpStatus,
  getValidYARDStatuses,
  getValidClickUpStatuses,
  STATUS_MAPPING, // Export for testing
};
