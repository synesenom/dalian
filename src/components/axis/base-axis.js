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
    format: x => x,
    scale,
    container,
    ticks: true,
    axisLine: true
  }

  let api = {
    // Variables
    label: '',
    fn: axisFn().ticks(5),
    axis,
    axisLabel: container.append('text')
      .attr('class', `axis-label ${name}`)
      .attr('stroke-width', 0)
      .attr('fill', 'currentColor')
      .style('font-size', '1em')
      .text(''),

    // Methods
    scale: scaleObj => {
      _.scale = scaleObj
    },

    adjustLabel: attr => {
      Object.entries(attr).forEach(d => {
        api.axisLabel.attr(...d)
      })
    },

    update: (duration, size, margins) => {
      // Update container
      _.container.attr('transform', 'translate(' + margins.left + ',' + margins.top + ')')
        .style('width', size.innerWidth)
        .style('height', size.innerHeight)

      // Update axis
      api.fn.scale(_.scale.scale)
        .tickFormat(_.format)
        .tickSize(_.ticks ? 6 : 0)
      api.axis
        .transition().duration(duration)
        .call(api.fn)
        .selectAll('path')
        .style('opacity', _.axisLine ? 1 : 0)

      // Update label
      api.axisLabel.text(api.label)
    },

    hideAxisLine: on => _.axisLine = !on,

    hideTicks: on => _.ticks = !on,

    tickFormat: (format = x => x) => _.format = format,

    setLabel: text => api.label = text,
  }

  return api
}
