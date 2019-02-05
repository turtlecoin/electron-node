'use strict'

const util = require('util')
const path = require('path')
const fs = require('fs')
const inherits = require('util').inherits
const EventEmitter = require('events').EventEmitter
const GHHelper = require('./githubhelper.js')

function Self () {
  this.helper = new GHHelper()
}
inherits(Self, EventEmitter)

Self.prototype.haveLatestVersion = function () {
  return new Promise((resolve, reject) => {
    this.helper.getCurrentRelease().then((release) => {
      const ourPath = path.join(process.cwd(), release.filename)
      const exists = fs.existsSync(ourPath)
      return resolve({ exists: exists, version: release.version, url: release.url })
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.downloadLatestRelease = function () {
  return new Promise((resolve, reject) => {
    this.helper.downloadLatestRelease().then((filename) => {
      this.emit('data', util.format('Downloaded: %s', filename))

      return this.helper.unpack(filename)
    }).then(() => {
      this.emit('data', util.format('Extracted the latest TurtleCoin version'))
    }).then(() => {
      return resolve()
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.downloadCheckpoints = function () {
  return new Promise((resolve, reject) => {
    this.helper.downloadCheckpoints().then((filename) => {
      this.emit('data', util.format('Downloaded: %s', filename))

      return this.helper.unpack(filename)
    }).then(() => {
      this.emit('data', util.format('Retrieved the latest TurtleCoin blockchain checkpoints'))
    }).then(() => {
      return resolve()
    }).catch((error) => {
      return reject(error)
    })
  })
}

module.exports = Self
