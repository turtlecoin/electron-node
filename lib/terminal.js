'use strict'

const Terminal = require('xterm').Terminal
const fullscreen = require('xterm/lib/addons/fullscreen/fullscreen')
const fit = require('xterm/lib/addons/fit/fit')
const inherits = require('util').inherits
const EventEmitter = require('events').EventEmitter

Terminal.applyAddon(fullscreen)
Terminal.applyAddon(fit)

function Self (targetElement) {
  if (!targetElement) throw new Error('Must specify a target element')
  if (!(this instanceof Self)) return new Self(targetElement)
  this.targetElement = targetElement
  this.xterm = new Terminal()
  this.xterm.open(this.targetElement)
  this.xterm.fit()

  this.xterm.on('data', (data) => {
    this.emit('data', data)
  })
}
inherits(Self, EventEmitter)

Self.prototype.size = function () {
  return { cols: this.xterm.cols, rows: this.xterm.rows }
}

Self.prototype.resize = function () {
  return this.xterm.fit()
}

Self.prototype.write = function (data) {
  return this.xterm.write(data)
}

Self.prototype.writeln = function (data) {
  return this.xterm.writeln(data)
}

Self.prototype.destroy = function () {
  return this.xterm.destroy()
}

module.exports = Self
