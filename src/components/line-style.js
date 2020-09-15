/**
 * Component implementing the line style features. When this component is available for a widget, its API is exposed via
 * the {.lineStyle} namespace.
 *
 * @function LineStyle
 */
export default (self, api) => {
  // Private members.
  const _ = {
    // Variables.
    policy: undefined,

    // Methods.
    getStrokeDashArray: style => {
      switch (style) {
        case 'solid':
        default:
          return null
        case 'dashed':
          return '5 8'
        case 'dotted':
          return '1 8'
      }
    }
  }

  // Protected members.
  self = Object.assign(self || {}, {
    _lineStyle: {
      /**
       * Returns the stroke dasharray CSS property value for a specific key.
       *
       * @method strokeDashArray
       * @methodOf LineStyle
       * @param {string} key Key to return stroke dasharray for.
       * @returns {(null | string)} The stroke dasharray value if policy is defined by a string or an object, null
       * otherwise (no stroke dasharray).
       * @ignore
       */
      strokeDashArray: key => {
        if (typeof _.policy === 'undefined') {
          // No policy, using default.
          return null
        } else if (typeof _.policy === 'string') {
          // Single policy, using the specified line style.
          return _.getStrokeDashArray(_.policy)
        } else {
          // Line style mapGroup given.
          return _.getStrokeDashArray(_.policy[key])
        }
      },

      /**
       * Returns the style for a specific key.
       *
       * @method style
       * @methodOf LineStyle
       * @param {string} key Key to return style for.
       * @returns {string} The style associated with the key.
       * @ignore
       */
      style: key => {
        if (typeof _.policy === 'undefined') {
          // No policy, using default.
          return 'solid'
        } else if (typeof _.policy === 'string') {
          // Single policy, using the specified line style.
          return _.policy
        } else {
          // Line style mapGroup given.
          return _.policy[key]
        }
      },

      /**
       * Returns the background CSS property value for a specific line style.
       *
       * @method background
       * @methodOf LinkStyle
       * @param {string} lineStyle Line style to return background pattern for.
       * @param {string} color Color to use for the background pattern.
       * @returns {string} The background CSS property value.
       * @ignore
       */
      background: (lineStyle, color) => {
        switch (lineStyle) {
          case 'solid':
          default:
            return color
          case 'dashed':
            return `repeating-linear-gradient(-45deg, transparent, transparent 2px, ${color} 2px, ${color} 4px`
          case 'dotted':
            return `radial-gradient(${color} 37%, transparent 37%) 0px 0px/6px 6px, radial-gradient(${color} 37%, transparent 37%) 3px 3px/6px 6px transparent`
        }
      }
    }
  })

  // Public API.
  api = Object.assign(api || {}, {
    /**
     * Sets the line style policy. Supported policies:
     * <ul>
     *     <li>Default line style policy (no arguments): The default line style is used which is solid for all plots.</li>
     *     <li>Single line style (passing {string}): The specified line style is used for all plots. Supported styles
     *     are: solid, dashed, dotted.</li>
     *     <li>Custom line style mapping (passing an {Object}): Plots that are listed as property name have the line
     *     style specified as the value for.</li>
     * </ul>
     *
     * @method lineStyle
     * @methodOf LineStyle
     * @param {(string | Object)} policy Line style policy to set. If not specified, the default policy is set which is
     * solid for all plots.
     * @returns {Object} Reference to the LineStyle API.
     */
    lineStyle: policy => {
      _.policy = policy
      return api
    }
  })

  // Return protected and public members.
  return { self, api }
}
