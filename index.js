'use strict'

const { app, BrowserWindow } = require('electron')
var win

function createWindow () {
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    titleBarStyle: 'hidden-inset',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true
    },
    icon: './src/icon.ico'
  })
  win.loadFile('src/index.html')

  // win.webContents.openDevTools()

  win.on('closed', () => {
    win = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})
