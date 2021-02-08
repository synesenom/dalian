const kebabToPascal = require('./kebab-to-pascal')

const getModuleName = path => path.split('/').slice(-1)[0]

module.exports = {
  getModuleName,

  getModuleCategory: path => path.split('/')[0],

  getFactoryName: path => kebabToPascal(getModuleName(path))
}
