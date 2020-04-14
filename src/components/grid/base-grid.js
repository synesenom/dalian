import extend from '../../core/extend'

/**
 * Component implementing grid lines.
 *
 * @function BaseGrid
 */
export default type => {
  return (self, api) => {
    // Private members
    let _ = {
      defaults: {
        opacity: 0.3,
        lineStyle: '4 8'
      },
      type,
      on: false,
      grid: undefined,
      opacity: undefined,
      lineStyle: undefined,

      update: duration => {
        // Add grid
        if (_.on) {
          if (typeof _.grid === 'undefined') {
            // If not yet added, create grid.
            _.grid = self._chart.plots.insert('g', ':first-child')
              .attr('class', 'grid')
              .style('opacity', 0)
              .style('stroke', 'currentColor')
              .style('stroke-width', '1px')
          }

          // Update grid.
          const axis = _.type === 'x' ? self._bottomAxis.axis : self._leftAxis.axis
          const length = _.type === 'x' ? parseFloat(self._widget.size.innerHeight) : -parseFloat(self._widget.size.innerWidth)
          _.grid.transition().duration(duration)
            .call(
              axis.tickSizeInner(length)
                .tickFormat('')
            )
            .style('stroke-opacity', _.opacity || _.defaults.opacity)
            .style('stroke-dasharray', _.lineStyle || _.defaults.lineStyle)
            .style('opacity', 1)

          // Remove path.
          _.grid.select('path').remove()
        } else {
          if (typeof _.grid !== 'undefined') {
            _.grid.transition().duration(duration)
              .style('opacity', 0)
              .remove()
            _.grid = undefined
          }
        }
      }
    }

    // Extend update
    self._widget.update = extend(self._widget.update, _.update)

    // Protected methods.
    let baseSelf = {
      // Changes type. Only accessible in YGrid.
      type: type => {
        _.type = type

        if (_.grid) {
          _.grid.remove()
          _.grid = undefined
        }
      }
    }

    // Public API.
    const gridApi = {
      /**
       * Turns on/off grid lines.
       *
       * @method on
       * @methodOf BaseGrid
       * @param {boolean} on Whether to have grid lines.
       * @returns {Widget} Reference to the Widget's API.
       */
      on: on => {
        _.on = on
        return api
      },

      /**
       * Sets the grid line's opacity. The grid color is the same as the axis color. Default opacity is 0.3.
       *
       * @method opacity
       * @methodOf BaseGrid
       * @param {number} value The opacity value.
       * @returns {Widget} Reference to the Widget's API.
       */
      opacity: value => {
        _.opacity = value
        return api
      },

      /**
       * Sets the grid line's line style. Default line style is dashed.
       *
       * @method lineStyle
       * @methodOf BaseGrid
       * @param {string} style Line style. Supported values: solid, dashed, dotted.
       * @returns {Widget} Reference to the Widget's API.
       */
      lineStyle: style => {
        switch (style) {
          case 'solid':
            _.lineStyle = '1 0'
            break
          case 'dashed':
          default:
            _.lineStyle = '4 8'
            break
          case 'dotted':
            _.lineStyle = '2 5'
            break
        }
        return api
      }
    }

    // Assign API methods (not subject to type change)
    api = Object.assign(api || {}, type === 'x' ? { xGrid: gridApi } : { yGrid: gridApi })

    return { baseSelf, self, api }
  }
}
