'use strict';
const { Command } = require('commander');
function createMetricsCommand() {
  return new Command('metrics').description('Performance metrics');
}
module.exports = { createMetricsCommand };
