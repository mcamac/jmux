#!/usr/bin/env node
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var program = _interopRequire(require("commander"));

var exec = require("child_process").exec;

var kexec = _interopRequire(require("kexec"));

var R = _interopRequire(require("ramda"));

var resolve = require("path").resolve;

program.version("0.1.0").option("-c, --config [config]", "Config location").option("-n, --just-print", "Just print tmux command").parse(process.argv);

function parseTmuxConfig(config) {
  var sessionCmd = "new-session -s \"" + config.title + "\"";
  var subcommands = [sessionCmd];

  R.forEach(function (window) {
    var windowCommands = [];
    windowCommands.push("new-window -n \"" + window.title + "\" -c \"" + config.root + "\"");

    // Create panes
    var paneCommands = R.times(function (paneCommand) {
      return "split-window -v -c \"" + config.root + "\"";
    }, window.panes.length - 1);
    paneCommands = R.intersperse("select-pane -D", paneCommands);
    windowCommands.push(paneCommands);

    // Choose layout and select top pane
    windowCommands.push(["select-layout " + window.layout, "select-pane -t 0"]);

    // Send keys to each pane in order
    window.panes.forEach(function (paneCommand) {
      var escapedPaneCommand = paneCommand.replace(/"/g, "\\\"");
      windowCommands.push(["send-keys \"" + escapedPaneCommand + "\" \"Enter\"", "select-pane -D"]);
    });
    subcommands.push(windowCommands);
  }, config.windows);

  subcommands.push("kill-window -t 0");

  var command = "tmux " + R.flatten(subcommands).join(" \\; ");
  return command;
}

var tmuxCommand = parseTmuxConfig(require(resolve(process.cwd(), program.config)));
if (program.justPrint) {
  console.log(tmuxCommand);
} else {
  kexec(tmuxCommand);
}

