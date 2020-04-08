import { axisLeft } from 'd3'
import BaseAxis from './base-axis'
import extend from '../../core/extend'

/**
 * Component implementing the left axis for charts. When this component is available for a widget, its API is exposed
 * via the {.leftAxis} namespace.
 *
 * @function LeftAxis
 */
export default scale => (() => {
  return (self, api) => {
    // Base class
    let base = BaseAxis('x', self._widget.content, axisLeft, scale)
    base.self.adjustLabel({
      'text-anchor': 'begin',
      x: 5 + 'px',
      y: (-5) + 'px'
    })

    // Private members
    let _ = {
      grid: null,
      gridStyle: null,

      update: duration => {
        // Update base axis
        base.self.update(duration, self._widget.size, self._widget.margins)
      }
    }

    // Protected members
    self = Object.assign(self || {}, {
      _leftAxis: {
        axis: base.self.fn,
        update: base.self.update,
        scale: base.self.scale,
        label: () => base.self.label
      }
    })

    // Extend update
    self._widget.update = extend(self._widget.update, _.update, true)

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
          base.self.setLabel(label)
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
          base.self.tickFormat(format)
          return self
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
          base.self.hideTicks(on)
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
          base.self.hideAxisLine(on)
          return api
        }
      }
    })

    return { self, api }
  }
})()
