// TODO Add API docs.
// TODO Add example.
export default defaultValue => {
  return (self, api) => {
    // Private members.
    const _ = {
      // Default behavior.
      mapping: () => defaultValue + 'px'
    }

    // Protected members.
    self = Object.assign(self || {}, {
      _lineColor: {
        // Mapping used internally.
        mapping: key => _.mapping(key)
      }
    })

    // Public API.
    api = Object.assign(api || {}, {
      /**
       * Sets the line color policy. Supported policies:
       * <ul>
       *     <li>Default line color policy (no arguments): The default color is used which is {currentColor} for all
       *     lines.</li>
       *     <li>Single color (passing {string}): The specified color is used for all lines.</li>
       *     <li>Custom line width mapping (passing an {Object}): Plots that are listed as property name have the color
       *     specified as the value for.</li>
       * </ul>
       *
       * @method lineColor
       * @methodOf LineColor
       * @param {(string | Object)} policy Line color policy to set. Default value depends on the widget that has this
       * component.
       * @returns {Widget} Reference to the Widget's API.
       */
      lineColor: (policy = defaultValue) => {
        if (typeof policy === 'string') {
          // Single color policy, using the specified color.
          _.mapping = () => policy
        } else {
          // Color mapping given. Try to get color for the specified key, or use the default if missing.
          _.mapping = key => policy[key] || defaultValue
        }
        return api
      }
    })

    return { self, api }
  }
}
