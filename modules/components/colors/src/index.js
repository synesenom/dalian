const defaultColors = () => {
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

export default (self, api) => {
  // Private members
  let _ = {
    policy: undefined,
    mapping: defaultColors()
  }

  // Protected members
  self = Object.assign(self || {}, {
    _colors: {
      mapping: key => _.mapping(key)
    }
  })

  // Public API
  api = Object.assign(api || {}, {
    /**
     * Sets the color policy. Supported policies:
     * <ul>
     *     <li>Default color policy (no arguments): the default color scheme is used which is a combination of the
     *     qualitative color schemes Set 1 and Set 3 from Color Brewer.</li>
     *     <li>Single color (passing {string}): The specified color is used for all plots.</li>
     *     <li>Custom color mapping (passing an {Object}): each plot has the color specified as the value for the
     *     property with the same name as the plot's key.</li>
     * </ul>
     *
     * @method colors
     * @methodOf Widget
     * @param {(string | Object)} [policy] Color policy to set. If not specified, the default policy is set.
     * @returns {Widget} Reference to the widget API.
     */
    colors: policy => {
      // Update color policy
      _.policy = policy

      // Update color mapping
      if (typeof policy === 'undefined') {
        // No color policy, using default
        _.mapping = defaultColors()
      } else if (typeof policy === 'string') {
        // Single color policy, using the specified color
        _.mapping = () => policy
      } else {
        // Color mapping given
        _.mapping = key => policy[key]
      }
      return api
    }
  })

  return { self, api }
}
