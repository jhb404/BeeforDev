// Electron APIs are available globally in the main process
// This file is used to work around the issue where require('electron') returns undefined
const { app, BrowserWindow, session } = require('electron');

// Export the Electron APIs to make them available to the main process
module.exports = {
  app,
  BrowserWindow,
  session
};
