const _extractDesc = require('../utils/dfs')
const TypeParser = require('./type-parser')

module.exports = param => {

  const isOptional = type => type.type === 'OptionalType' || typeof param.default !== 'undefined'

  return {
    name: param.name,
    desc: _extractDesc(param),
    optional: isOptional(param.type),
    default: param.default && param.default.replace('=>', ' => '),
    type: TypeParser(param.type)
  }
}
