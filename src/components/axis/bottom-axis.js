import { axisBottom } from 'd3'
import BaseAxis from './base-axis'
import extend from '../../core/extend'

/**
 * Component implementing the bottom axis for charts. When this component is available for a widget, its API is exposed
 * via the {.bottomAxis} namespace.
 *
 * @function BottomAxis
 */
export default scale => {
  return (self, api) => {
    // Base class
    let base = BaseAxis('x', self, axisBottom, scale)
    base.adjustLabel({
      'text-anchor': 'end',
      dy: '2.5em'
    })

    // Private members
    let _ = {
      update: duration => {
        // Update base axis.
        self._widget.getElem(base.axis, duration)
          .attr('transform', 'translate(0,' + parseFloat(self._widget.size.innerHeight) + ')')

        // Update label.
        self._widget.getElem(base.axisLabel, duration)
          .attr('x', self._widget.size.innerWidth)
          .attr('y', parseFloat(self._widget.size.innerHeight) + 'px')
      }
    }

    // Extend update methods
    base.update = extend(base.update, _.update)
    self._widget.update = extend(
      self._widget.update, duration => base.update(duration, self._widget.size, self._widget.margins)
    )

    // Protected members
    self = Object.assign(self || {}, {
      _bottomAxis: {
        axis: base.fn,
        update: base.update,
        scale: base.scale,
        label: () => base.label
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
         * @returns {Widget} Reference to the Widget's API.
         */
        label: (label = '') => {
          base.setLabel(label)
          return api
        },

        /**
         * Sets the X tick format of the chart.
         *
         * @method tickFormat
         * @methodOf BottomAxis
         * @param {Function} format Function to set as formatter.
         * @returns {Widget} Reference to the Widget's API.
         */
        tickFormat: format => {
          base.tickFormat(format)
          return api
        },

        /**
         * Hides the tick lines on the axis.
         *
         * @method hideTicks
         * @methodOf BottomAxis
         * @param {boolean} on Whether hiding ticks is on.
         * @returns {Widget} Reference to the Widget's API.
         */
        hideTicks: on => {
          base.hideTicks(on)
          return api
        },

        /**
         * Hides the axis line on the axis.
         *
         * @method hideAxisLine
         * @methodOf BottomAxis
         * @param {boolean} on Whether hiding the axis line is on.
         * @returns {Widget} Reference to the Widget's API.
         */
        hideAxisLine: on => {
          base.hideAxisLine(on)
          return api
        }
      }
    })

    return { self, api }
  }
}
