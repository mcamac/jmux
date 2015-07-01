#!/usr/bin/env node

import program from 'commander'
import {exec} from 'child_process'
import kexec from 'kexec'
import R from 'ramda'
import {resolve} from 'path'

program
  .version('0.1.0')
  .option('-c, --config [config]', 'Config location')
  .option('-n, --just-print', 'Just print tmux command')
  .parse(process.argv)

function parseTmuxConfig(config) {
  var sessionCmd = `new-session -s "${config.title}"`
  var subcommands = [sessionCmd]

  R.forEach((window) => {
    var windowCommands = []
    windowCommands.push(`new-window -n "${window.title}" -c "${config.root}"`)

    // Create panes
    var paneCommands = R.times((paneCommand) => {
      return `split-window -v -c "${config.root}"`
    }, window.panes.length - 1)
    paneCommands = R.intersperse('select-pane -D', paneCommands)
    windowCommands.push(paneCommands)

    // Choose layout and select top pane
    windowCommands.push([
      `select-layout ${window.layout}`,
      `select-pane -t 0`])

    // Send keys to each pane in order
    window.panes.forEach((paneCommand) => {
      var escapedPaneCommand = paneCommand.replace(/"/g, '\\\"')
      windowCommands.push([
        `send-keys "${escapedPaneCommand}" "Enter"`,
        `select-pane -D`])
    })
    subcommands.push(windowCommands)
  }, config.windows)

  subcommands.push(`kill-window -t 0`)

  var command = 'tmux ' + R.flatten(subcommands).join(' \\; ')
  return command;
}

var tmuxCommand = parseTmuxConfig(require(resolve(process.cwd(), program.config)))
if (program.justPrint) {
  console.log(tmuxCommand)
} else {
  kexec(tmuxCommand)
}
