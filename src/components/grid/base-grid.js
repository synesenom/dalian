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
        color: '#aaa',
        lineWidth: 1,
        lineStyle: '4 8'
      },
      on: false,
      grid: undefined,
      color: undefined,
      lineWidth: undefined,
      lineStyle: undefined,

      update: duration => {
        // Add grid
        if (_.on) {
          if (typeof _.grid === 'undefined') {
            // If not yet added, create grid.
            _.grid = self._chart.plots.insert('g', ':first-child')
              .attr('class', 'grid')
              .style('opacity', 0)
          }

          // Update grid.
          const axis = type === 'x' ? self._bottomAxis.axis : self._leftAxis.axis
          const length = type === 'x' ? parseFloat(self._widget.size.innerHeight) : -parseFloat(self._widget.size.innerWidth)
          _.grid.transition().duration(duration)
            .call(
              axis.tickSizeInner(length)
                .tickFormat('')
            )
            .style('color', _.color || _.defaults.color)
            .style('stroke-width', (_.lineWidth || _.defaults.lineWidth) + 'px')
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
       * Sets the grid line's color. Default color is #aaa.
       *
       * @method color
       * @methodOf BaseGrid
       * @param {string} color String representing the color.
       * @returns {Widget} Reference to the Widget's API.
       */
      color: color => {
        _.color = color
        return api
      },

      /**
       * Sets the grid line's line width in pixels. Default line width is 1px.
       *
       * @method lineWidth
       * @methodOf BaseGrid
       * @param {number} value Line width in pixels.
       * @returns {Widget} Reference to the Widget's API.
       */
      lineWidth: value => {
        _.lineWidth = value
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

    api = Object.assign(api || {}, type === 'x' ? { xGrid: gridApi } : { yGrid: gridApi })
    return api
  }
}
