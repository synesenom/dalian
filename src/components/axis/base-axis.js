export default (name, parent, axisFn, scale) => {
  // Private members
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
  axis.selectAll('path')
    .style('fill', 'none')
    .style('stroke-width', '1px')
    .style('shape-rendering', 'crispEdges')
    .style('stroke', 'currentColor')
  let _ = {
    label: '',
    format: x => x,
    scale,
    container,
    fn: axisFn().ticks(5),
    ticks: true
  }

  let self = {
    axis,
    label: container.append('text')
      .attr('class', `axis-label ${name}`)
      .attr('stroke-width', 0)
      .attr('fill', 'currentColor')
      .style('font-size', '1em')
      .text('')
  }

  // Public API
  let api = {
    tickFormat: (format = x => x) => {
      _.format = format
      return api
    },

    label: text => {
        _.label = text
        return api
    },

    adjustLabel: attr => {
      Object.entries(attr).forEach(d => {
        self.label.attr(d[0], d[1])
      })
      return api
    },

    update: (duration, size, margins) => {
      // Update container
      _.container.attr('transform', 'translate(' + margins.left + ',' + margins.top + ')')
        .style('width', size.innerWidth)
        .style('height', size.innerHeight)

      // Update axis
      _.fn.scale(_.scale.scale)
        .tickFormat(_.format)
        .tickSize(_.ticks ? 6 : 0)
        .tickPadding(10)
      self.axis
        // FIXME Axis transition not working
        .transition().duration(duration)
        .call(_.fn)

      // Update label
      self.label.text(_.label)
    },

    scale: scaleObj => {
      _.scale = scaleObj
      return api
    },

    noTicks: on => {
      _.ticks = !on
      return api
    }
  }

  return {self, api}
}
