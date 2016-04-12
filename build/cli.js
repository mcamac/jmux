#!/usr/bin/env node
'use strict';

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _child_process = require('child_process');

var _kexec = require('kexec');

var _kexec2 = _interopRequireDefault(_kexec);

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

var _path = require('path');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('lazy-ass');

var packageJson = require('../package.json');

_commander2.default.version(packageJson.version).option('-c, --config [config]', 'Config location').option('-n, --just-print', 'Just print tmux command').parse(process.argv);

var SUPPORTED_LAYOUTS = {
  'even-horizontal': {
    nextPaneFlag: '-R',
    splitFlag: '-h'
  },
  'even-vertical': {
    nextPaneFlag: '-D',
    splitFlag: '-v'
  }
};

function parseTmuxConfig(config) {
  var subcommands = process.env.TMUX ? [] : ['new-session -s "' + config.title + '"'];

  var allWindowCommands = _ramda2.default.map(function (window) {
    var windowCommands = [];
    windowCommands.push('new-window -n "' + window.title + '" -c "' + config.root + '"');

    la(SUPPORTED_LAYOUTS[window.layout], 'layout not supported', window.layout);
    var layoutParams = SUPPORTED_LAYOUTS[window.layout];
    var splitFlag = layoutParams.splitFlag;
    var nextPaneFlag = layoutParams.nextPaneFlag;

    // Create panes

    var paneCommands = _ramda2.default.times(function (paneCommand) {
      return 'split-window ' + splitFlag + ' -c "' + config.root + '"';
    }, window.panes.length - 1);
    paneCommands = _ramda2.default.intersperse('select-pane ' + nextPaneFlag, paneCommands);
    windowCommands.push(paneCommands);

    // Wrap around to the first pane
    windowCommands.push(_ramda2.default.repeat('select-pane ' + nextPaneFlag, 2));

    // Choose layout
    windowCommands.push('select-layout ' + window.layout);

    // Send keys to each pane in order
    window.panes.forEach(function (paneCommand) {
      var escapedPaneCommand = paneCommand.replace(/"/g, '\\\"');
      windowCommands.push(['send-keys "' + escapedPaneCommand + '" "Enter"', 'select-pane ' + nextPaneFlag]);
    });
    return windowCommands;
  }, config.windows);

  subcommands.push(allWindowCommands);
  subcommands.push('kill-window -t 0');

  return 'tmux ' + _ramda2.default.flatten(subcommands).join(' \\; ');
}

var tmuxCommand = parseTmuxConfig(require((0, _path.resolve)(process.cwd(), _commander2.default.config)));
if (_commander2.default.justPrint) {
  console.log(tmuxCommand);
} else {
  (0, _kexec2.default)(tmuxCommand);
}

