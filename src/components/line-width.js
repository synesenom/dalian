// TODO Add default line width as parameter.
export default defaultValue => {
  return (self, api) => {
    // Private members.
    let _ = {
      // Default behavior.
      mapping: () => defaultValue + 'px'
    }

    // Protected members.
    self = Object.assign(self || {}, {
      _lineWidth: {
        // Mapping used internally.
        mapping: key => _.mapping(key)
      }
    })

    // Public API.
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
       * @methodOf LineWidth
       * @param {(string | Object)} [policy] Line width policy to set. If not specified, the default policy is set.
       * @returns {Widget} Reference to the Widget's API.
       */
      lineWidth: policy => {
        // Update line width mapGroup.
        if (typeof policy === 'undefined') {
          // No line width policy, using default.
          _.mapping = () => defaultValue + 'px'
        } else if (typeof policy === 'number') {
          // Single line width policy, using the specified line width.
          _.mapping = () => policy + 'px'
        } else {
          // Line width mapping given. Try to getElem line width for specified key, or use 2px if missing.
          _.mapping = key => (policy[key] || defaultValue) + 'px'
        }
        return api
      }
    })

    return { self, api }
  }
}
