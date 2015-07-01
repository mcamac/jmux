#!/usr/bin/env node
"use strict";

var program = require("commander");

var _require = require("child_process");

var exec = _require.exec;

var kexec = require("kexec");
var R = require("ramda");

var resolve = require("path").resolve;

program.version("0.1.0").option("-c, --config [config]", "Config location").parse(process.argv);

function parseTmuxConfig(config) {
  console.log(config);
  var sessionCmd = "new-session -s \"" + config.title + "\"";
  var subcommands = [sessionCmd];

  R.forEach(function (window) {
    var windowCommands = [];
    windowCommands.push("new-window -n \"" + window.title + "\" -c \"" + config.root + "\"");
    var paneCommands = R.times(function (paneCommand) {
      return "split-window -v -c \"" + config.root + "\"";
    }, window.panes.length - 1);
    paneCommands = R.intersperse("select-pane -D", paneCommands);
    console.log(window, windowCommands, paneCommands);
    windowCommands = windowCommands.concat(paneCommands);
    windowCommands.push("select-layout " + window.layout);
    windowCommands.push("select-pane -t 0");
    window.panes.forEach(function (pane) {
      var escapedPane = pane.replace(/"/g, "\\\"");
      windowCommands.push("send-keys \"" + escapedPane + "\" \"Enter\"");
      windowCommands.push("select-pane -D");
    });
    subcommands.push(windowCommands);
  }, config.windows);

  subcommands.push("kill-window -t 0");
  // subcommands.push(`sek-window -t 0`)

  var command = "tmux " + R.flatten(subcommands).join(" \\; ");
  console.log(command);
  return command;
}

kexec(parseTmuxConfig(require(resolve(process.cwd(), program.config))));

