#!/usr/bin/env node

import program from 'commander'
import {exec} from 'child_process'
import kexec from 'kexec'
import R from 'ramda'
import {resolve} from 'path'
require('lazy-ass')


var packageJson = require('../package.json')

program
  .version(packageJson.version)
  .option('-c, --config [config]', 'Config location')
  .option('-n, --just-print', 'Just print tmux command')
  .parse(process.argv)


const SUPPORTED_LAYOUTS = {
  'even-horizontal': {
    nextPaneFlag: '-R',
    splitFlag: '-h'
  },
  'even-vertical': {
    nextPaneFlag: '-D',
    splitFlag: '-v'
  }
}


function parseTmuxConfig(config) {
  var subcommands = process.env.TMUX ? [] : [`new-session -s "${config.title}"`]

  var allWindowCommands = R.map((window) => {
    var windowCommands = []
    windowCommands.push(`new-window -n "${window.title}" -c "${config.root}"`)

    la(SUPPORTED_LAYOUTS[window.layout], 'layout not supported', window.layout)
    var layoutParams = SUPPORTED_LAYOUTS[window.layout]
    var {splitFlag, nextPaneFlag} = layoutParams;

    // Create panes
    var paneCommands = R.times((paneCommand) => {
      return `split-window ${splitFlag} -c "${config.root}"`
    }, window.panes.length - 1)
    paneCommands = R.intersperse(`select-pane ${nextPaneFlag}`, paneCommands)
    windowCommands.push(paneCommands)

    // Wrap around to the first pane
    windowCommands.push(
      R.repeat(`select-pane ${nextPaneFlag}`, 2));

    // Choose layout
    windowCommands.push(`select-layout ${window.layout}`)

    // Send keys to each pane in order
    window.panes.forEach((paneCommand) => {
      var escapedPaneCommand = paneCommand.replace(/"/g, '\\\"')
      windowCommands.push([
        `send-keys "${escapedPaneCommand}" "Enter"`,
        `select-pane ${nextPaneFlag}`])
    })
    return windowCommands
  }, config.windows)

  subcommands.push(allWindowCommands)
  subcommands.push(`kill-window -t 0`)

  return 'tmux ' + R.flatten(subcommands).join(' \\; ')
}

var tmuxCommand = parseTmuxConfig(require(resolve(process.cwd(), program.config)))
if (program.justPrint) {
  console.log(tmuxCommand)
} else {
  kexec(tmuxCommand)
}
