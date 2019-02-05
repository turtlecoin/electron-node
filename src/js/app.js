'use strict'

const path = require('path')
const util = require('util')
const os = require('os')
const fs = require('fs')
const Terminal = require(path.join(process.cwd(), 'lib/terminal.js'))
const SoftwareManager = require(path.join(process.cwd(), 'lib/versionhelper.js'))
const Pty = require(path.join(process.cwd(), 'lib/pty.js'))
const app = require('electron').remote.app

$(document).ready(() => {
  const term = new Terminal(document.getElementById('terminal'))
  const daemon = new Pty()
  const helper = new SoftwareManager()
  const execFile = path.join(process.cwd(), ((os.platform() === 'win32') ? 'TurtleCoind.exe' : 'TurtleCoind'))
  const dataDir = path.join(getHomeDir(), ((os.platform() === 'win32') ? 'TurtleCoin' : '.TurtleCoin'))
  const startArgs = [
    '--rpc-bind-ip 0.0.0.0',
    '--enable-blockexplorer',
    '--load-checkpoints',
    'checkpoints.csv'
  ]

  function log (msg) {
    term.writeln(util.format('%s', msg))
  }

  function getHomeDir () {
    if (os.platform() === 'win32') {
      return process.env.APPDATA
    } else {
      return os.homedir()
    }
  }

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir)
  }

  term.on('data', (data) => {
    if (daemon.isRunning()) {
      daemon.write(data)
    } else {
      term.write(data)
    }
  })

  daemon.on('data', (data) => {
    term.write(data)
  })

  daemon.on('error', (error) => {
    log(util.format('[ERROR] TurtleCoind error occurred: %s', error))
  })

  daemon.on('exit', (exitcode) => {
    log('')
    log('')
    log('TurtleCoind has exited')
    setTimeout(() => {
      app.close()
    }, 30000)
  })

  helper.on('data', (data) => {
    log(data)
  })

  log('Checking that we have the latest version of the TurtleCoin software...')
  helper.haveLatestVersion().then((latest) => {
    if (latest.exists) {
      log(util.format('Excellent, we have the latest version: %s', latest.version))
    } else {
      log(util.format('New version available: %s', latest.version))
      log(util.format('Fetching from: %s', latest.url))
      return helper.downloadLatestRelease()
    }
  }).then(() => {
    log(util.format('Fetching the latest blockchain checkpoints...'))
    // return helper.downloadCheckpoints()
  }).then(() => {
    log(util.format('Storing the blockchain data in: %s', dataDir))
  }).then(() => {
    log('Starting TurtleCoind...')
  }).then(() => {
    daemon.start(execFile, startArgs, term.size().cols, term.size().rows)
  }).catch((error) => {
    log(util.format('[ERROR] %s', error))
  })

  $(window).resize(() => {
    term.resize()
    daemon.resize(term.size().cols, term.size().rows)
  })
})
