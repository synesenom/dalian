import { axisLeft } from 'd3'
import BaseAxis from './base-axis'

/**
 * Component implementing the left axis for charts. When this component is available for a widget, its API is exposed
 * via the {.leftAxis} namespace.
 *
 * @function LeftAxis
 */
export default scale => {
  return (self, api) => {
    // Base class.
    let base = BaseAxis('y', self, axisLeft, scale, {
      'text-anchor': 'begin',
      x: 5 + 'px',
      y: (-5) + 'px'
    })

    // Protected members: just inherit from base axis.
    self = Object.assign(self || {}, { _leftAxis: base })

    // Public API.
    api = Object.assign(api || {}, {
      leftAxis: {
        /**
         * Sets the Y label for the chart.
         *
         * @method label
         * @memberOf LeftAxis
         * @param {string} label Text to set as the label.
         * @returns {Object} Reference to the LeftAxis API.
         */
        label: (label = '') => {
          base.label.text(label)
          return api
        },

        /**
         * Sets the Y tick format of the chart.
         *
         * @method format
         * @memberOf LeftAxis
         * @param {Function} format Function to set as formatter.
         * @returns {Object} Reference to the LeftAxis API.
         */
        format: format => {
          base.format(format)
          return api
        },

        /**
         * Sets the Y tick values explicitly to the specified values.
         *
         * @method values
         * @memberOf LeftAxis
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
         * @memberOf LeftAxis
         * @param {boolean} on Whether hiding ticks is on.
         * @returns {Widget} Reference to the Widget's API.
         */
        // TODO Change this to color.
        hideTicks: on => {
          base.hideTicks(on)
          return api
        },

        /**
         * Hides the axis line on the axis.
         *
         * @method hideAxisLine
         * @memberOf LeftAxis
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
