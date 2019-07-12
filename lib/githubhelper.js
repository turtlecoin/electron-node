'use strict'

const downloadFile = require('download-file')
const request = require('request-promise-native')
const path = require('path')
const os = require('os')
const unzip = require('unzipper')
const targz = require('targz')
const fs = require('fs')

const platform = os.platform()
const arch = os.arch()
const checkpointsURL = 'https://github.com/turtlecoin/checkpoints/raw/master/checkpoints.csv.tar.gz'
const releasesURL = 'https://api.github.com/repos/turtlecoin/turtlecoin/releases/latest'

function Self () {
  if (!(this instanceof Self)) return new Self()
}

Self.prototype.downloadCheckpoints = function () {
  return this.download(checkpointsURL, 'checkpoints.tar.gz')
}

Self.prototype.downloadLatestRelease = function () {
  return new Promise((resolve, reject) => {
    this.getCurrentRelease().then((release) => {
      return this.download(release.url, release.filename)
    }).then((result) => {
      return resolve(result)
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.download = function (url, filename) {
  return new Promise((resolve, reject) => {
    downloadFile(url, {
      directory: process.cwd(),
      filename: filename,
      timeout: (5 * 60 * 1000)
    }, (error) => {
      if (error === 302) {
        this.resolveRedirect(url).then((newUrl) => {
          return resolve(this.download(newUrl, filename))
        }).catch((error) => {
          return reject(error)
        })
      } else if (error) {
        return reject(error)
      } else if (!error) {
        return resolve(path.join(process.cwd(), filename))
      }
    })
  })
}

Self.prototype.resolveRedirect = function (url) {
  return new Promise((resolve, reject) => {
    request({
      url: url,
      followRedirect: false,
      resolveWithFullResponse: true
    }).then((response) => {
      return reject(new Error('Not a redirect'))
    }).catch((error) => {
      if (error.response && error.response.headers && error.response.headers.location) {
        return resolve(error.response.headers.location)
      }
      return reject(error)
    })
  })
}

Self.prototype.getCurrentRelease = function () {
  return new Promise((resolve, reject) => {
    request({
      url: releasesURL,
      json: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
      }
    }).then((result) => {
      result.assets.forEach((asset) => {
        if (asset.name.indexOf('windows') !== -1 && platform === 'win32') {
          return resolve({ url: asset.browser_download_url, filename: asset.name, version: result.name })
        } else if (asset.name.indexOf('osx') !== -1 && platform === 'darwin') {
          return resolve({ url: asset.browser_download_url, filename: asset.name, version: result.name })
        } else if (asset.name.indexOf('aarch64') !== -1 && arch === 'arm64') {
          return resolve({ url: asset.browser_download_url, filename: asset.name, version: result.name })
        } else if (asset.name.indexOf('linux') !== -1 && platform !== 'win32' && platform !== 'darwin' && arch !== 'arm64') {
          return resolve({ url: asset.browser_download_url, filename: asset.name, version: result.name })
        }
      })

      return reject(new Error('Could not find suitable release for this system'))
    }).catch((error) => {
      return reject(error)
    })
  })
}

Self.prototype.unpack = function (filename) {
  return new Promise((resolve, reject) => {
    /* Run standard unzip */
    if (filename.indexOf('.zip') !== -1) {
      fs.createReadStream(filename)
        .pipe(unzip.Parse())
        .on('entry', (entry) => {
          if (entry.path.indexOf('TurtleCoind') !== -1) {
            entry.path = path.basename(entry.path)
            entry.pipe(fs.createWriteStream(path.join(process.cwd(), entry.path)))
          } else {
            entry.autodrain()
          }
        })
        .on('close', () => {
          return resolve()
        })
    } else if (filename.indexOf('.tar.gz') !== -1) { /* Tarball unpack */
      targz.decompress({
        src: filename,
        dest: process.cwd(),
        tar: {
          ignore: (_, header) => {
            if (header.name.indexOf('checkpoints') === -1 && header.name.indexOf('TurtleCoind') === -1) {
              return true
            }
            return false
          },
          map: (header) => {
            if (header.name.indexOf('checkpoints') !== -1 || header.name.indexOf('TurtleCoind') !== -1) {
              header.name = path.basename(header.name)
              return header
            }
            return header
          }
        }
      }, (error) => {
        if (error) return reject(error)
        return resolve()
      })
    } else {
      return reject(new Error('Could not unpack'))
    }
  })
}

module.exports = Self
