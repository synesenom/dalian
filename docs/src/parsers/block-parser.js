const _extractDesc = require('../utils/dfs')
const ParamParser = require('./param-parser')

module.exports = block => {
  const id = block.name
  const params = block.params.map(ParamParser)

  return {
    id,
    signature: (() => {
      switch (block.kind) {
        default:
        case 'function':
          return `${id}(${params.map((d, i) => `${d.optional ? '[' : ''}${i > 0 ? ', ' : ''}${d.name}`)
            .join('')}${params.filter(d => d.optional).map(() => ']').join('')})`
        case 'namespace':
          return id
      }
    })(),
    description: _extractDesc(block),
    returns: (() => {
      let ret = block.returns[0]
      return ret && {
        desc: _extractDesc(ret),
        type: [ret.type.name]
      }
    })(),
    params,
    examples: block.examples.length > 0 ? block.examples.map(d => d.description) : undefined
  }
}
