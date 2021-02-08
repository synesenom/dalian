const fs = require('fs')

module.exports = path => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
  }
}
