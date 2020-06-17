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
    // Base class.
    let base = BaseAxis('x', self, axisBottom, scale, {
      'text-anchor': 'end',
      dy: '2.5em'
    })

    // Private members.
    let _ = {
      update: duration => {
        self._widget.getElem(base.axis, duration)
          .attr('transform', `translate(0, ${parseFloat(self._widget.size.innerHeight)})`)

        // Update label.
        self._widget.getElem(base.label, duration)
          .attr('x', self._widget.size.innerWidth)
          .attr('y', parseFloat(self._widget.size.innerHeight) + 'px')
      }
    }

    // Protected members: just inherit from base axis.
    self = Object.assign(self || {}, { _bottomAxis: base })

    // Extend update method.
    self._widget.update = extend(self._widget.update, _.update)

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
         *
         * @example
         *
         * // Set bottom axis label to 'time'.
         * chart.bottomAxis.label('time')
         */
        label: (label = '') => {
          base.label.text(label)
          return api
        },

        /**
         * Sets the X tick format of the chart.
         *
         * @method format
         * @methodOf BottomAxis
         * @param {Function} format Function to set as formatter.
         * @returns {Widget} Reference to the Widget's API.
         *
         * @example
         *
         * // Set bottom axis format to percentages.
         * chart.bottomAxis.format(x => x + '%')
         */
        format: format => {
          base.format(format)
          return api
        },

        /**
         * Sets the X tick values explicitly to the specified values.
         *
         * @method values
         * @methodOf BottomAxis
         * @param {(number[] | string[])} values The values to show ticks for.
         * @returns {Widget} Reference to the Widget's API.
         *
         * @example
         *
         * // Show tick values for bottom axis only at 1, 2 and 3.
         * chart.bottomAxis.values([1, 2, 3])
         */
        values: values => {
          base.values(values)
          return api
        },

        /**
         * Hides the tick lines on the axis.
         *
         * @method hideTicks
         * @methodOf BottomAxis
         * @param {boolean} on Whether hiding ticks is on.
         * @returns {Widget} Reference to the Widget's API.
         *
         * @example
         *
         * // Hide tick lines for bottom axis.
         * chart.bottomAxis.hideTicks(true)
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
         *
         * @example
         *
         * // Hide axis line for bottom axis.
         * chart.bottomAxis.hideAxisLine(true)
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
