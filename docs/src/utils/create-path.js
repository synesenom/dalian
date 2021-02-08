const createDir = require('./create-dir')

module.exports = path => {
  let dirs = path.split('/')
  dirs.reduce((current, dir) => {
    current += '/' + dir
    createDir(current)
    return current
  }, '.')
}
