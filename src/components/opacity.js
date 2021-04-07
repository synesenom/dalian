/**
 * Component implementing the opacity feature. This component allows for setting the opacity value of a widget's
 * elements. When this component is available, its API is exposed directly via the widget's own namespace.
 *
 * @function Opacity
 */
export default defaultValue => {
  return (self, api) => {
    // Private members.
    const _ = {
      value: defaultValue
    }

    // Protected members.
    self = Object.assign(self || {}, {
      _opacity: {
        /**
         * Returns the current opacity value.
         *
         * @method value
         * @memberOf Opacity
         * @protected
         * @returns {number} The current opacity value.
         */
        value: () => _.value
      }
    })

    // Public API.
    api = Object.assign(api || {}, {
      /**
       * Sets the opacity value of the widget's elements.
       *
       * @method opacity
       * @memberOf Opacity
       * @param {number} value The opacity value to set. The default value depends on the widget that has this
       * component.
       * @returns {Widget} Reference to the Widget's API.
       */
      opacity: (value = defaultValue) => {
        _.value = value || defaultValue
        return api
      }
    })

    return { self, api }
  }
}
