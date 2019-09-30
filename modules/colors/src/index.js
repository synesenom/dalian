export default (_self, _api) => {
  // Set default values
  let self = _self || {}
  self.colors = {
    policy: undefined,
    mapping: key => _defaultColors(key)
  }

  // Private methods
  const _defaultColors = () => {
    let keys = []
    return key => {
      let i = keys.indexOf(key)
      return [
        '#e41a1c',
        '#377eb8',
        '#4daf4a',
        '#984ea3',
        '#ff7f00',
        '#ffff33',
        '#a65628',
        '#f781bf',
        '#999999',
        '#8dd3c7',
        '#ffffb3',
        '#bebada',
        '#fb8072',
        '#80b1d3',
        '#fdb462',
        '#b3de69',
        '#fccde5',
        '#d9d9d9'
      ][i > -1 ? i : keys.push(key) - 1]
    }
  }

  // Public API
  let api = _api || {}
  api.colors = policy => {
    // Update color policy
    self.colors.policy = policy

    // Update color mapping
    if (typeof policy === 'undefined') {
      // No color policy, using default
      self.colors.mapping = _defaultColors()
    } else if (typeof policy === 'string') {
      // Single color policy, using the specified color
      self.colors.mapping = () => policy
    } else {
      // Color mapping given
      self.colors.mapping = key => policy[key]
    }
    return api
  }

  return { self, api }
}
