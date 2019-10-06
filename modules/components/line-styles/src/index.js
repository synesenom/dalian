// TODO Get rid of nulls
export default (self, api) => {
  // Set default values
  self = self || {}

  // Private methods
  const _getStrokeDashArray = style => {
    switch (style) {
      case 'solid':
      default:
        return null
      case 'dashed':
        return '4 4'
      case 'dotted':
        return '2 5'
      case 'dash-dotted':
        return '5 5 2 5'
    }
  }

  self._lineStyles = {
    policy: undefined,
    mapping: () => null
  }

  // Public API
  api = api || {}
  api.lineStyles = policy => {
    // Update line style policy
    self._lineStyles.policy = policy

    // Update line style mapping
    if (typeof policy === 'undefined') {
      // No policy, using default
      self._lineStyles.mapping = () => null
    } else if (typeof policy === 'string') {
      // Single policy, using the specified line style
      self._lineStyles.mapping = () => _getStrokeDashArray(policy)
    } else {
      // Line style mapping given
      self._lineStyles.mapping = key => _getStrokeDashArray(policy[key])
    }
    return api
  }

  return { self, api }
}
