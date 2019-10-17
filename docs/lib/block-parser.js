const _extractDesc = require('./dfs')
const ParamParser = require('./param-parser')

module.exports = block => {
  const getName = e => e.name
  const getDescription = e => _extractDesc(e)
  const getParams = e => e.params.map(ParamParser)
  const getReturns = e => {
    let ret = e.returns[0]
    return ret && {
      desc: _extractDesc(ret),
      type: [ret.type.name]
    }
  }

  let _ = {
    name: getName(block),
    description: getDescription(block),
    returns: getReturns(block),
    params: getParams(block)
  }

  return {
    id: () => _.name,
    signature: () => `${_.name}(${_.params.map((d, i) => `${d.optional ? '[' : ''}${i > 0 ? ', ' : ''}${d.name}`).join('')}${_.params.filter(d => d.optional).map(() => ']').join('')})`,
    description: () => _.description,
    returns: () => _.returns,
    params: () => _.params
  }
}
