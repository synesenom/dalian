/**
 * Component implementing the opacity feature. This component allows for setting the opacity value of a widget's
 * elements. When this component is available, its API is exposed directly via the widget's own namespace.
 *
 * @function Opacity
 */
export default (self, api) => {
  // Private members
  let _ = {
    value: 0.5
  }

  // Protected members
  self = Object.assign(self || {}, {
    _opacity: {
      value: () => _.value
    }
  })

  // Public API
  api = Object.assign(api || {}, {
    /**
     * Sets the opacity value of the widget's elements.
     *
     * @method opacity
     * @methodOf Opacity
     * @param {number} value The opacity value to set.
     * @returns {Widget} Reference to the Widget's API.
     */
    opacity: value => {
      _.value = value
      return api
    }
  })

  return {self, api}
}
