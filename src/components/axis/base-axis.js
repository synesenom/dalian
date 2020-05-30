import extend from '../../core/extend'
import attributes from '../../utils/attributes'

export default (type, self, axisFn, scale, labelAttr) => {
  // Container: an SVG group that contains all axis related DOM elements
  let container = self._widget.content.append('g')
    .attr('class', `dalian-axis-container ${type}`)
    .style('font-family', 'inherit')
    .style('font-size', 'inherit')

  // The axis group
  let axis = container.append('g')
    .attr('class', `axis ${type}`)
    .style('font-family', 'inherit')
    .style('font-size', 'inherit')

  // Axis path.
  axis.selectAll('path')
    .style('fill', 'none')
    .style('stroke-width', '1px')
    .style('shape-rendering', 'crispEdges')
    .style('stroke', 'currentColor')

  // Private members.
  let _ = {
    format: x => x,
    values: null,
    scale,
    container,
    ticks: true,
    axisLine: true,

    // Update method.
    update: duration => {
      // Update container
      self._widget.getElem(_.container, duration)
        .attr('transform', 'translate(' + self._widget.margins.left + ',' + self._widget.margins.top + ')')
        .style('width', self._widget.size.innerWidth)
        .style('height', self._widget.size.innerHeight)

      // Update axis
      api.fn.scale(_.scale.scale)
        .tickFormat(_.format)
        .tickSize(_.ticks ? 6 : 0)
        .tickPadding(_.ticks ? 3 : 9)
        .tickValues(_.values || null)
      self._widget.getElem(api.axis, duration)
        .call(api.fn)
        .selectAll('path')
        .style('opacity', _.axisLine ? 1 : 0)
    }
  }

  // Public members.
  let api = {
    // Axis function.
    fn: axisFn().ticks(5),

    // Axis selection.
    axis,

    label: attributes(container.append('text')
      .attr('class', `axis-label ${type}`)
      .attr('stroke-width', 0)
      .attr('fill', 'currentColor')
      .style('font-size', '1em')
      .text(''), labelAttr),

    // Change scale object.
    scale: scale => {
      _.scale = scale
    },

    // Hide axis line.
    hideAxisLine: on => {
      _.axisLine = !on
    },

    // Hide tick lines.
    hideTicks: on => {
      _.ticks = !on
    },

    // Tick format.
    format: (format = x => x) => {
      _.format = format
    },

    // Set specific tick values.
    values: (values = null) => {
      _.values = values
    }
  }

  // Extend update.
  self._widget.update = extend(self._widget.update, _.update, true)

  return api
}
