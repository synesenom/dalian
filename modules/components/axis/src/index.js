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
  // Private members
  let _ = (() => {
    let container = self._widget.content.append('g')
      .attr('class', `dalian-axis-container ${name}`)

    let axis = container.append('g')
      .attr('class', `${name} axis`)

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

    return {
      container,
      axis,
      label,
      fn
    }
  })()

  // Public API
  let api = {
    scale: scale => {
      _.fn.scale(scale)
      return api
    },

    tickFormat: format => {
      _.fn.tickFormat(format)
      return api
    },

    label: text => {
      _.label.text(text)
      return api
    },

    update: duration => {
      // Set font attributes
      let fontColor = typeof self._font !== 'undefined' ? self._font.color : 'black'
      let fontSize = typeof self._font !== 'undefined' ? self._font.size : '12px'

      // Update container
      _.container.attr('transform', 'translate(' + self._widget.margins.left + ',' + self._widget.margins.top + ')')
        .style('width', self._widget.size.innerWidth)
        .style('height', self._widget.size.innerHeight)
        .style('pointer-events', 'all')
        .style('font-family', 'inherit')

      // Update axis
      _.axis.style('font-family', 'inherit')
        .transition().duration(duration)
        .call(_.fn)

      // Update label
      switch (type) {
        case 'bottom': {
          _.axis.transition().duration(duration)
            .attr('transform', 'translate(0,' + parseFloat(self._widget.size.innerHeight) + ')')
          _.label.transition().duration(duration)
            .attr('x', self._widget.size.innerWidth)
            .attr('y', (parseFloat(self._widget.size.innerHeight) + 2.2 * parseInt(fontSize)) + 'px')
          break
        }
        case 'left': {
          _.label.transition().duration(duration)
            .attr('x', 5 + 'px')
            .attr('y', (-5) + 'px')
          break
        }
      }
      _.axis.selectAll('path')
        .style('fill', 'none')
        .style('stroke', fontColor)
        .style('stroke-width', '1px')
        .style('shape-rendering', 'crispEdges')
      _.label.attr('fill', fontColor)
        .style('font-size', fontSize)

      return api
    }
  }

  return api
}
