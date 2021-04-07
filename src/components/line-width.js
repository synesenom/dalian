/**
 * Component implementing the line width features. When this component is available for a widget, its API is exposed via
 * the {.lineWidth} namespace.
 *
 * @function LineWidth
 */
export default defaultValue => {
  return (self, api) => {
    // Private members.
    const _ = {
      mapping: () => defaultValue + 'px'
    }

    // Protected members.
    self = Object.assign(self || {}, {
      _lineWidth: {
        // Mapping used internally.
        /**
         * Returns the current line width mapping for a key.
         *
         * @method mapping
         * @memberOf LineWidth
         * @param {string} key Key to return line-width for.
         * @returns {string} The current line width in pixels with the 'px' suffix.
         */
        mapping: key => _.mapping(key)
      }
    })

    // Public API.
    api = Object.assign(api || {}, {
      /**
       * Sets the line width policy. Supported policies:
       * <ul>
       *     <li>Default line width policy (no arguments): The default line width is used for all lines. The value of
       *     the default line width depends on the widget.</li>
       *     <li>Single number (passing {number}): The specified line width is used for all lines.</li>
       *     <li>Custom line width mapping (passing an {Object}): Plots that are listed as property name have the line
       *     width specified as the value for.</li>
       * </ul>
       *
       * @method lineWidth
       * @memberOf LineWidth
       * @param {(string | Object)} policy Line width policy to set. Default value depends on the widget that has this
       * component.
       * @returns {Widget} Reference to the Widget's API.
       */
      lineWidth: (policy = defaultValue) => {
        if (typeof policy === 'number') {
          // Single line width policy, using the specified line width.
          _.mapping = () => policy + 'px'
        } else {
          // Line width mapping given. Try to the line width for the specified key, or use the default if missing.
          _.mapping = key => (policy[key] || defaultValue) + 'px'
        }
        return api
      }
    })

    return { self, api }
  }
}
