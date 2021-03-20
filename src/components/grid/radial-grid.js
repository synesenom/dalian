import extend from '../../core/extend'
import {curveLinearClosed, lineRadial} from 'd3'

// Default values.
const DEFAULTS = {
  on: false,
  opacity: 0.3,
  curved: false
}

// TODO Docstring.
// TODO API.
// TODO Example.
export default (self, api) => {
  // The grid itself.
  let grid = self._widget.content.insert('g', ':first-child')
    .attr('class', 'grid')

  // Private members.
  const _ = Object.assign({}, DEFAULTS)

  // Extend widget update.
  self._widget.update = extend(self._widget.update, duration => {
    if (_.on) {
      if (typeof grid === 'undefined') {
        // If not yet added, create grid.
        grid = self._widget.content.insert('g', ':first-child')
          .attr('class', 'grid')
      }

      if (_.curved) {
        grid.attr('transform', `translate(${parseFloat(self._widget.size.width) / 2}, ${parseFloat(self._widget.size.height) / 2})`)
          .selectAll('circle')
          .data(self._radialAxis.ticks())
          .join(
            enter => enter.append('circle')
              .attr('cx', 0)
              .attr('cy', 0)
              .attr('r', self._radialAxis.radialScale())
              .attr('fill', 'none')
              .attr('stroke', 'currentColor')
              .style('stroke-width', '1px')
              .style('stroke-opacity', _.opacity),

            update => update.transition().duration(duration)
              .attr('r', self._radialAxis.radialScale()),

            exit => exit.remove()
          )
      } else {
        const angularScale = self._radialAxis.angularScale()
        const lineFn = lineRadial()
          .angle((d, i) => angularScale(i))
          .radius(self._radialAxis.radialScale())
          .curve(curveLinearClosed)

        grid
          .attr('transform', `translate(${parseFloat(self._widget.size.width) / 2}, ${parseFloat(self._widget.size.height) / 2})`)
          .selectAll('path')
          .data(self._radialAxis.ticks()
            .map(d => Array(self._radialAxis.labels().length)
              .fill(d)))
          .join(
            enter => enter.append('path')
              .attr('d', lineFn)
              .attr('fill', 'none')
              .attr('stroke', 'currentColor')
              .style('stroke-width', '1px')
              .style('stroke-opacity', _.opacity),

            update => update.transition().duration(duration)
              .attr('d', lineFn),

            // TODO Opacity first.
            exit => exit.remove()
          )
      }
    } else {
      // Remove grid
      if (typeof grid !== 'undefined') {
        grid.transition().duration(duration)
          .style('opacity', 0)
          .remove()
        grid = undefined
      }
    }
  })

  api = Object.assign(api || {}, {
    // TODO Add .lineStyle
    radialGrid: {
      // TODO Docstring
      opacity (opacity = DEFAULTS.opacity) {
        _.opacity = opacity
        return api
      },

      // TODO Docstring
      on (on = DEFAULTS.on) {
        _.on = on
        return api
      },

      // TODO Docstring
      curved (curved = DEFAULTS.curved) {
        _.curved = curved
        return api
      }
    }
  })

  return {self, api}
}
