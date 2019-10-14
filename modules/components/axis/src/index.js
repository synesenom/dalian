import { axisBottom, axisLeft } from 'd3-axis';
import 'd3-transition';

/**
 * Factory implementing the axis component.
 *
 * @function Axis
 * @param {string} name Name of the axis. Typically x or y.
 * @param {string} type Axis type. Supported values: left, bottom.
 * @param {Object} self Object containing the protected members of the component that inherits from this component.
 */
export default (name, type, parent) => {
  // Private members
  let _ = (() => {
    // Container: an SVG group that contains all axis related DOM elements
    let container = parent.append('g')
      .attr('class', `dalian-axis-container ${name}`)
      .style('font-family', 'inherit')
      .style('font-size', 'inherit')

    // The axis group
    let axis = container.append('g')
      .attr('class', `${name} axis`)
      .style('font-family', 'inherit')
      .style('font-size', 'inherit')

    // Axis label
    let label = container.append('text')
      .attr('class', `axis-label ${name}`)
      .attr('stroke-width', 0)
      .attr('fill', 'currentColor')
      .style('font-size', '1em')
      .text('')

    // Axis functionality
    let fn
    switch (type) {
      case 'bottom':
        fn = axisBottom()
        label = label.attr('text-anchor', 'end')
          .attr('dy', '2.2em')
        break
      case 'left':
        fn = axisLeft()
        label = label.attr('text-anchor', 'begin')
          .attr('x', 5 + 'px')
          .attr('y', (-5) + 'px')
        break
    }
    fn.ticks(5)

    axis.selectAll('path')
      .style('fill', 'none')
      .style('stroke-width', '1px')
      .style('shape-rendering', 'crispEdges')
      .style('stroke', 'currentColor')

    return {
      container,
      axis,
      label,
      fn
    }
  })()

  // Public API
  let api = {
    /**
     * Sets the scale of the axis.
     *
     * @method scale
     * @methodOf Axis
     * @param {Object} scale Object representing the axis scale.
     * @returns {Object} Reference to the axis API.
     */
    scale: scale => {
      _.fn.scale(scale)
      return api
    },

    /**
     * Sets the axis tick format.
     *
     * @method tickFormat
     * @methodOf Axis
     * @param {Function} format Function to use as the tick formatter.
     * @returns {Object} Reference to the axis API.
     */
    tickFormat: format => {
      _.fn.tickFormat(format)
      return api
    },

    /**
     * Sets the axis label.
     *
     * @method label
     * @methodOf Axis
     * @param {string} text Text to set axis label to. Cannot be HTML formatted.
     * @returns {Object} Reference to the axis API.
     */
    label: text => {
      _.label.text(text)
      return api
    },

    /**
     * Updates the axis.
     *
     * @method update
     * @methodOf Axis
     * @param {number} duration Duration of the update animation in ms.
     * @returns {Object} Reference to the axis API.
     */
    update: (duration, size, margins) => {
      // Update container
      _.container.attr('transform', 'translate(' + margins.left + ',' + margins.top + ')')
        .style('width', size.innerWidth)
        .style('height', size.innerHeight)

      // Update axis
      _.axis
        .transition().duration(duration)
        .call(_.fn)

      // Update label
      switch (type) {
        case 'bottom': {
          _.axis.transition().duration(duration)
            .attr('transform', 'translate(0,' + parseFloat(size.innerHeight) + ')')
          _.label.transition().duration(duration)
            .attr('x', size.innerWidth)
            .attr('y', parseFloat(size.innerHeight) + 'px')
          break
        }
      }

      return api
    }
  }

  // Return public API
  return api
}
