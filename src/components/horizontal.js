// Default values.
const DEFAULTS = {
  on: false
}

// TODO Docstring.
export default (scales) => {
  return (self, api) => {
    // Private members.
    const _ = {
      on: DEFAULTS.on,
      scales: {
        x: scales.x,
        y: scales.y
      }
    }

    // Protected members.
    self = Object.assign(self || {}, {
      _horizontal: {
        on: () => _.on,

        scales: () => _.scales
      }
    })

    // Public API.
    api = Object.assign(api || {}, {
      /**
       * Converts the current chart to a horizontal one. Note that this method does not swap the axis labels.
       *
       * @method horizontal
       * @methodOf Horizontal
       * @param {boolean} on Whether the chart should be horizontal.
       * @returns {Widget} Reference to the Widget's API.
       */
      horizontal (on = DEFAULTS.on) {
        _.on = on

        // Assign scales
        _.scales.x = on ? scales.y : scales.x
        _.scales.y = on ? scales.x : scales.y

        // Update axes
        self._bottomAxis.scale(_.scales.x)
        self._leftAxis.scale(_.scales.y)

        // Update grid.
        if (typeof self._yGrid !== 'undefined') {
          self._yGrid.type(on ? 'x' : 'y')
        }

        return api
      }
    })

    return { self, api }
  }
}
