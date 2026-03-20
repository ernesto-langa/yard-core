'use strict';
const { Command } = require('commander');
function createProCommand() {
  return new Command('pro').description('Pro features management');
}
module.exports = { createProCommand };
