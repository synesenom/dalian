module.exports = {
  getModuleCategory (path) {
    return path.split('/')[0]
  },

  getModuleName (path) {
    return path.split('/').slice(-1)[0]
  }
}
