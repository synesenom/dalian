export default (self, api) => {
  // Private members
  let _ = {
    policy: undefined,
    mapping: () => '2px'
  }

  // Protected members
  self = Object.assign(self || {}, {
    _lineWidth: {
      mapping: key => _.mapping(key)
    }
  })

  // Public API
  api = Object.assign(api || {}, {
    /**
     * Sets the line width policy. Supported policies:
     * <ul>
     *     <li>Default line width policy (no arguments): The default line width is used which is 2px for all lines.</li>
     *     <li>Single number or (passing {number}): The specified line width is used for all lines.</li>
     *     <li>Custom line width mapping (passing an {Object}): Plots that are listed as property name have the line
     *     width specified as the value for.</li>
     * </ul>
     *
     * @method lineWidth
     * @methodOf Widget
     * @param {(string | Object)} [policy] Line width policy to set. If not specified, the default policy is set.
     * @returns {Widget} Reference to the widget API.
     */
    lineWidth: policy => {
      // Update line width policy
      _.policy = policy

      // Update line width mapping
      if (typeof policy === 'undefined') {
        // No line width policy, using default
        _.mapping = () => '2px'
      } else if (typeof policy === 'number') {
          // Single line width policy, using the specified line width
          _.mapping = () => policy + 'px'
      } else {
        // Line width mapping given
        _.mapping = key => policy[key] + 'px'
      }
      return api
    }
  })

  return { self, api }
}
