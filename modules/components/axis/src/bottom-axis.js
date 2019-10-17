import { axisBottom } from 'd3-axis';
import BaseAxis from './base-axis'
import extend from '../../../core/src/extend'

export default (self, api, name, scale) => {
  // Base class
  let base = BaseAxis(name, self._widget.content, axisBottom, scale)
  base.api.adjustLabel({
    'text-anchor': 'end',
    dy: '2.2em'
  })

  // Extend base axis update
  base.api.update = extend(base.api.update, duration => {
    base.self.axis.transition().duration(duration)
      .attr('transform', 'translate(0,' + parseFloat(self._widget.size.innerHeight) + ')')
    base.self.label.transition().duration(duration)
      .attr('x', self._widget.size.innerWidth)
      .attr('y', parseFloat(self._widget.size.innerHeight) + 'px')
  })

  // Extend widget update
  self._widget.update = extend(
    self._widget.update,
    duration => base.api.update(duration, self._widget.size, self._widget.margins)
  )

  // Protected members
  self = Object.assign(self || {}, {
    _axisBottom: {
      update: base.api.update
    }
  })

  // Public API
  api = Object.assign(api || {}, {
    /**
     * Sets the X label for the chart.
     *
     * @method xLabel
     * @methodOf BottomAxis
     * @param {string} label Text to set as the label.
     * @returns {Object} Reference to the BottomAxis API.
     */
    xLabel: label => {
      base.api.label(label)
      return api
    },

    /**
     * Sets the X tick format of the chart.
     *
     * @method xTickFormat
     * @methodOf BottomAxis
     * @param {Function} format Function to set as formatter.
     * @returns {Object} Reference to the BottomAxis API.
     */
    xTickFormat: format => {
      base.api.tickFormat(format)
      return api
    }
  })

  return {self, api}
}