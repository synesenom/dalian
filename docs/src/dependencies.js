const meta = require('../../package')


module.exports = Object.entries(meta.dependencies)
  .map(d => ({
    lib: d[0],
    version: d[1].match(/(\d+.\d+.\d+)$/)[0]
  }))
