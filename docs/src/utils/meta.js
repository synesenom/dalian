const meta = require('../../../package')


module.exports = {
  dependencies: Object.entries(meta.dependencies)
    .map(d => ({
      lib: d[0],
      version: d[1].match(/(\d+.\d+.\d+)$/)[0]
    })),
  name: meta.name
}
