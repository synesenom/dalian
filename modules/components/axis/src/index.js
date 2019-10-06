import { axisBottom, axisLeft } from 'd3-axis';
import 'd3-transition';

/**
 * Component implementing an axis.
 *
 * @class Axis
 * @param name
 * @param type
 * @param self
 */
export default (name, type, self) => {
  let container = self._widget.content.append('g')
    .attr('class', `dalian-axis-container ${name}`)
  let axis = container.append('g')
    .attr('class', `${name} axis`)

  // Add type dependent members
  let label = container.append('text')
    .attr('class', `axis-label ${name}`)
    .attr('stroke-width', 0)
    .text('')
  let fn
  switch (type) {
    case 'bottom':
      fn = axisBottom()
      label = label.attr('text-anchor', 'end')
      break
    case 'left':
      fn = axisLeft()
      label = label.attr('text-anchor', 'begin')
      break
  }
  fn.ticks(5)

  // Public API
  let api = {
    scale: scale => {
      fn.scale(scale)
      return api
    },

    tickFormat: format => {
      fn.tickFormat(format)
      return api
    },

    label: text => {
      label.text(text)
      return api
    },

    update: duration => {
      // Set font attributes
      let fontColor = typeof self._font !== 'undefined' ? self._font.color : 'black'
      let fontSize = typeof self._font !== 'undefined' ? self._font.size : '12px'

      // Update container
      container.attr('transform', 'translate(' + self._widget.margins.left + ',' + self._widget.margins.top + ')')
        .style('width', self._widget.size.innerWidth)
        .style('height', self._widget.size.innerHeight)
        .style('pointer-events', 'all')

      // Update axis
      axis.transition().duration(duration)
        .call(fn)

      // Update label
      switch (type) {
        case 'bottom': {
          axis.transition().duration(duration)
            .attr('transform', 'translate(0,' + parseFloat(self._widget.size.innerHeight) + ')')
          label.transition().duration(duration)
            .attr('x', self._widget.size.innerWidth)
            .attr('y', (parseFloat(self._widget.size.innerHeight) + 2.2 * parseInt(fontSize)) + 'px')
          break
        }
        case 'left': {
          label.transition().duration(duration)
            .attr('x', 5 + 'px')
            .attr('y', (-5) + 'px')
          break
        }
      }
      axis.selectAll('path')
        .style('fill', 'none')
        .style('stroke', fontColor)
        .style('stroke-width', '1px')
        .style('shape-rendering', 'crispEdges')
      label.attr('fill', fontColor)
        .style('font-size', fontSize)

      return api
    }
  }

  return api
}
