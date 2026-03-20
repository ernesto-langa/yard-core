'use strict';
const { Command } = require('commander');
function createGenerateCommand() {
  return new Command('generate').description('Generate boilerplate');
}
module.exports = { createGenerateCommand };
