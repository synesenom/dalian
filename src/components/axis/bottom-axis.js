import { axisBottom } from 'd3'
import BaseAxis from './base-axis'
import extend from '../../core/extend'

export default (name, scale) => (() => {
  return (self, api) => {
    // Base class
    let base = BaseAxis(name, self._widget.content, axisBottom, scale)
    base.self.adjustLabel({
      'text-anchor': 'end',
      dy: '2.4em'
    })

    // Extend base axis update
    base.self.update = extend(base.self.update, duration => {
      base.self.axis.transition().duration(duration)
        .attr('transform', 'translate(0,' + parseFloat(self._widget.size.innerHeight) + ')')
      base.self.axisLabel.transition().duration(duration)
        .attr('x', self._widget.size.innerWidth)
        .attr('y', parseFloat(self._widget.size.innerHeight) + 'px')
    })

    // Extend widget update
    self._widget.update = extend(
      self._widget.update, duration => base.self.update(duration, self._widget.size, self._widget.margins)
    )

    // Protected members
    self = Object.assign(self || {}, {
      _axisBottom: {
        update: base.self.update,
        scale: base.self.scale
      }
    })

    // Public API
    api = Object.assign(api || {}, {
      bottomAxis: {
        /**
         * Sets the X label for the chart.
         *
         * @method label
         * @methodOf BottomAxis
         * @param {string} label Text to set as the label.
         * @returns {Object} Reference to the BottomAxis API.
         */
        label: (label = '') => {
          base.self.label(label)
          return api
        },

        /**
         * Sets the X tick format of the chart.
         *
         * @method tickFormat
         * @methodOf BottomAxis
         * @param {Function} format Function to set as formatter.
         * @returns {Object} Reference to the BottomAxis API.
         */
        tickFormat: format => {
          base.self.tickFormat(format)
          return api
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
