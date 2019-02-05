'use strict'

const pty = require('node-pty')
const inherits = require('util').inherits
const EventEmitter = require('events').EventEmitter

function Self () {
  if (!(this instanceof Self)) return new Self()
}
inherits(Self, EventEmitter)

Self.prototype.start = function (path, args, cols, rows) {
  this.process = pty.spawn(path, args, {
    name: 'xterm-color',
    cols: cols,
    rows: rows,
    cwd: process.cwd(),
    env: process.env
  })

  this.process.on('data', (data) => {
    this.emit('data', data)
  })

  this.process.on('error', (error) => {
    this.emit('error', error)
    delete this.process
  })

  this.process.on('exit', (exitcode) => {
    setTimeout(() => {
      this.emit('exit', exitcode)
      delete this.process
    }, 2000)
  })
}

Self.prototype.resize = function (cols, rows) {
  if (this.process) return this.process.resize(cols, rows)
  return false
}

Self.prototype.write = function (data) {
  if (!this.process) return
  return this.process.write(data)
}

Self.prototype.destroy = function () {
  if (!this.process) return false
  this.process.kill()
  delete this.process
  return true
}

Self.prototype.isRunning = function () {
  return (this.process)
}

module.exports = Self
