module.exports = function (moduleName) {
  return moduleName.split('-')
    .map(d => d.charAt(0).toUpperCase() + d.substring(1))
    .join('')
}
