// Read doc JSON
const doc = require('../modules/line-chart/docs')

const keys = [
  'description',
  'tags',
  'loc',
  'context',
  'augments',
  'examples',
  'implements',
  'params',
  'properties',
  'returns',
  'sees',
  'throws',
  'todos',
  'yields',
  'kind',
  'members',
  'path',
  'namespace'
]

function _dfs(obj, key, map) {
  if (obj.children) {
    return map(obj.children.map(d => _dfs(d, key, map)))
  } else {
    return obj[key]
  }
}

function getName(entry) {
  return entry.name
}

function getKind(entry) {
  return entry.kind
}

function getDescription(entry) {
  return _dfs(entry.description, 'value', d => d.join(' '))
    .replace(/\s+/g, ' ')
}

function getReturns(entry) {
  return entry.returns
}

doc.forEach(entry => {
  console.log(getName(entry), getReturns(entry))
})
