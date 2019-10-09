/**
 * Component implementing line style features.
 *
 * @class LineStyle
 * @param {Object} self Object containing the protected variables and methods.
 * @param {Object} api Object containing the public API methods.
 * @returns {{self: Object, api: Object}} Object containing the extended protected and public containers.
 */
export default (self, api) => {
  // Private members
  let _ = {
    // Variables
    policy: undefined,

    // Methods
    getStrokeDashArray: style => {
      switch (style) {
        case 'solid':
        default:
          return null
        case 'dashed':
          return '4 4'
        case 'dotted':
          return '2 5'
      }
    }
  }

  // Protected members
  self = Object.assign(self || {}, {
    _lineStyles: {
      /**
       * Returns the stroke dasharray CSS property value for a specific key.
       *
       * @method strokeDashArray
       * @methodOf LineStyle
       * @param {string} key Key to return stroke dasharray for.
       * @returns {(null | string)} The stroke dasharray value if policy is defined by a string or an object, null
       * otherwise (no stroke dasharray).
       * @protected
       */
      strokeDashArray: key => {
        // Update line style mapping
        if (typeof _.policy === 'undefined') {
          // No policy, using default
          return null
        } else if (typeof _.policy === 'string') {
          // Single policy, using the specified line style
          return _.getStrokeDashArray(_.policy)
        } else {
          // Line style mapping given
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
       * @protected
       */
      style: key => {
        if (typeof _.policy === 'undefined') {
          // No policy, using default
          return 'solid'
        } else if (typeof _.policy === 'string') {
          // Single policy, using the specified line style
          return _.policy
        } else {
          // Line style mapping given
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
       */
      background: (lineStyle, color) => {
        switch (lineStyle) {
          case 'solid':
          default:
            return color
          case 'dashed':
            return `repeating-linear-gradient(-45deg, transparent, transparent 2px, ${color} 2px, ${color} 4px`
          case 'dotted':
            return `radial-gradient(${color} 30%, transparent 30%) 0.5px 0.5px/4px 4px, radial-gradient(${color} 30%, transparent 30%) 2.5px 2.5px/4px 4px transparent`
        }
      }
    }
  })

  // Public API
  api = Object.assign(api || {}, {
    /**
     * Sets the line style policy to the specified value. If policy is not specified, line style is set to 'solid' for
     * all plots. If policy is a string representing the line style, it is set to all plots. If policy is an object with
     * keys as plot names and values as line style values, the object is used as a mapping from plot names to line
     * styles.
     *
     * @method lineStyle
     * @methodOf LineStyle
     * @param {(string | Object)} [policy] Policy to set line styles to.
     * @returns {Object} Reference to the current component's public API.
     */
    lineStyle: policy => {
      _.policy = policy
      return api
    }
  })

  // Return protected and public members
  return { self, api }
}
