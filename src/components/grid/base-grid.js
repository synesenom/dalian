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
      on: false,
      grid: undefined,
      color: undefined,
      lineWidth: 1,
      lineStyle: '4 8',

      update: duration => {
        // Add grid
        if (_.on) {
          if (typeof _.grid === 'undefined') {
            const axis = type === 'x' ? self._axisBottom.axis : self._axisLeft.axis
            const length = type === 'x' ? parseFloat(self._widget.size.innerHeight) : -parseFloat(self._widget.size.innerWidth)
            _.grid = self._chart.plots.insert('g', ':first-child')
              .attr('class', 'grid')
              .style('opacity', 0)
              .call(
                axis.tickSizeInner(length)
                  .tickFormat('')
              )
              .style('color', _.color || '#ccc')
              .style('stroke-width', (_.lineWidth || 1) + 'px')
              .style('stroke-dasharray', _.lineStyle || null)
            _.grid.select('path').remove()

            // Show grid
            _.grid.transition().duration(duration)
              .style('opacity', 1)
          }
          _.grid.transition().duration(duration)
            .style('color', _.color || '#ccc')
            .style('stroke-width', (_.lineWidth || 1) + 'px')
            .style('stroke-dasharray', _.lineStyle || null)
        } else {
          if (_.grid !== null) {
            _.grid.remove()
            _.grid = null
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
       * Sets the grid line's color. The default color is #ccc.
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
       * Sets the grid line's line width in pixels. The default line width is 1px.
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
       * Sets the grid line's line style.
       *
       * @method lineStyle
       * @methodOf BaseGrid
       * @param {string} style Line style. Supported values: solid, dashed, dotted.
       * @returns {Widget} Reference to the Widget's API.
       */
      lineStyle: style => {
        switch (style) {
          case 'solid':
          default:
            _.lineStyle = null
            break
          case 'dashed':
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
