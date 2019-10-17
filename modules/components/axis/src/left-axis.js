import { axisLeft } from 'd3-axis';
import BaseAxis from './base-axis'
import extend from '../../../core/src/extend'

export default (self, api, name, scale) => {
  // Base class
  let base = BaseAxis(name, self._widget.content, axisLeft, scale)
  base.api.adjustLabel({
    'text-anchor': 'begin',
    x: 5 + 'px',
    y: (-5) + 'px'
  })

  // Protected members
  self = Object.assign(self || {}, {
    _axisLeft: {
      update: base.api.update
    }
  })

  // Extend update
  self._widget.update = extend(
    self._widget.update,
      duration => base.api.update(duration, self._widget.size, self._widget.margins)
  )

  // Public API
  api = Object.assign(api || {}, {
    /**
     * Sets the Y label for the chart.
     *
     * @method yLabel
     * @methodOf LeftAxis
     * @param {string} label Text to set as the label.
     * @returns {Object} Reference to the LeftAxis API.
     */
    yLabel: label => {
      base.api.label(label)
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
    yTickFormat: format => {
      base.api.tickFormat(format)
      return api
    }
  })

  return {self, api}
}