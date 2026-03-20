'use strict';
const { Command } = require('commander');
function createManifestCommand() {
  return new Command('manifest').description('Manage service manifests');
}
module.exports = { createManifestCommand };
