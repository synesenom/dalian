/**
 * Component implementing the label feature. A label is an arbitrary text content attached to the widget's elements.
 * When this component is available, its API is exposed directly via the widget's own namespace.
 *
 * @function Label
 */
export default (self, api) => {
  // Protected members.
  self = Object.assign(self || {}, {
    _label: {
      show: false,
      format: () => ''
    }
  })

  // Protected members.
  api = Object.assign(api || {}, {
    /**
     * Sets the label formatter.
     *
     * @method label
     * @methodOf Label
     * @param {Function?} label Function that takes a single data point as parameter and returns a text representing the
     * label to show.
     * @returns {Widget} Reference to the Widget's API.
     */
    label: label => {
      // Show label if parameter is not empty or null.
      self._label.show = typeof label !== 'undefined' && label !== null

      // Update label formatter.
      self._label.format = label || (() => '')
      return api
    }
  })

  return { self, api }
}
