import { axisTop } from 'd3'
import BaseAxis from './base-axis'
import extend from '../../core/extend'

/**
 * Component implementing the top axis for charts. When this component is available for a widget, its API is exposed
 * via the {.topAxis} namespace.
 *
 * @function TopAxis
 */
export default scale => {
  return (self, api) => {
    // Base class.
    let base = BaseAxis('x', self, axisTop, scale, {
      'text-anchor': 'end',
      dy: '2.5em'
    })

    // Protected members: just inherit from base axis.
    self = Object.assign(self || {}, { _topAxis: base })

    // Extend update method.
    self._widget.update = extend(self._widget.update, duration => {
      self._widget.getElem(base.label, duration)
        .attr('x', self._widget.size.innerWidth)
    })

    // Public API
    api = Object.assign(api || {}, {
      topAxis: {
        /**
         * Sets the X label for the chart.
         *
         * @method label
         * @memberOf TopAxis
         * @param {string} label Text to set as the label.
         * @returns {Widget} Reference to the Widget's API.
         */
        label: (label = '') => {
          base.label.text(label)
          return api
        },

        /**
         * Sets the X tick format of the chart.
         *
         * @method format
         * @memberOf TopAxis
         * @param {Function} format Function to set as formatter.
         * @returns {Widget} Reference to the Widget's API.
         */
        format: format => {
          base.format(format)
          return api
        },

        /**
         * Sets the X tick values explicitly to the specified values.
         *
         * @method values
         * @memberOf TopAxis
         * @param {(number[] | string[])} values The values to show ticks for.
         * @returns {Widget} Reference to the Widget's API.
         */
        values: values => {
          base.values(values)
          return api
        },

        /**
         * Hides the tick lines on the axis.
         *
         * @method hideTicks
         * @memberOf TopAxis
         * @param {boolean} on Whether hiding ticks is on.
         * @returns {Widget} Reference to the Widget's API.
         */
        // TODO Change this to color.
        hideTicks: on => {
          base.self.hideTicks(on)
          return api
        },

        /**
         * Hides the axis line on the axis.
         *
         * @method hideAxisLine
         * @memberOf TopAxis
         * @param {boolean} on Whether hiding the axis line is on.
         * @returns {Widget} Reference to the Widget's API.
         */
        // TODO Change this to color.
        hideAxisLine: on => {
          base.hideAxisLine(on)
          return api
        }
      }
    })

    return { self, api }
  }
}
