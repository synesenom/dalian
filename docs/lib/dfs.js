const _dfs = (obj, key, map) => {
  if (Array.isArray(obj.children)) {
    return map(obj.children.map(d => _dfs(d, key, map)))
  } else {
    return obj[key]
  }
}

const simplify = str => str.replace(/\s+/g, ' ')

const toCode = str => str.replace(/\{(.*?)\}/g, m => `<code>${m.slice(1, -1)}</code>`)

module.exports = obj => _dfs(obj.description, 'value', d => simplify(toCode(d.join(' '))))
