import { axisLeft } from 'd3'
import BaseAxis from './base-axis'
import extend from '../../core/extend'

export default (name, scale) => (() => {
  return (self, api) => {
    // Base class
    let base = BaseAxis(name, self._widget.content, axisLeft, scale)
    base.self.adjustLabel({
      'text-anchor': 'begin',
      x: 5 + 'px',
      y: (-5) + 'px'
    })

    // Protected members
    self = Object.assign(self || {}, {
      _axisLeft: {
        update: base.self.update,
        scale: base.self.scale
      }
    })

    // Extend update
    self._widget.update = extend(
      self._widget.update,
      duration => base.self.update(duration, self._widget.size, self._widget.margins)
    )

    // Public API
    api = Object.assign(api || {}, {
      leftAxis: {
        /**
         * Sets the Y label for the chart.
         *
         * @method yLabel
         * @methodOf LeftAxis
         * @param {string} label Text to set as the label.
         * @returns {Object} Reference to the LeftAxis API.
         */
        label: label => {
          base.self.label(label)
          return api
        },

        /**
         * Sets the Y tick format of the chart.
         *
         * @method yTickFormat
         * @methodOf LeftAxis
         * @param {Function} format Function to set as formatter.
         * @returns {Object} Reference to the LeftAxis API.
         */
        tickFormat: format => {
          base.api.tickFormat(format)
          return self
        },

        hideTicks: on => {
          base.self.hideTicks(on)
          return api
        },

        hideAxisLine: on => {
          base.self.hideAxisLine(on)
          return api
        }
      }
    })

    return { self, api }
  }
})()
