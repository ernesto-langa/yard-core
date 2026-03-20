'use strict';
const { Command } = require('commander');
function createQaCommand() {
  return new Command('qa').description('Quality assurance commands');
}
module.exports = { createQaCommand };
