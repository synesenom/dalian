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
    ticks: true,
    axisLine: true
  }

  let self = {
    // Variables
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
        self.axisLabel.attr(...d)
      })
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
        .selectAll('path')
        .style('opacity', _.axisLine ? 1 : 0)

      // Update label
      self.axisLabel.text(_.label)
    },

    hideAxisLine: on => _.axisLine = !on,

    hideTicks: on => _.ticks = !on,

    tickFormat: (format = x => x) => _.format = format,

    label: text => _.label = text
  }

  let api = {}
  return {self, api}
}
