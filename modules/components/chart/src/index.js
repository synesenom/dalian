import { select } from 'd3-selection'
import { compose, encode, extend } from '../../../core/src/index'
import Widget from '../../widget/src/index'
import Font from '../../font/src/index'
import Colors from '../../colors/src/index'
import Tooltip from '../../tooltip/src/index'
import Mouse from '../../mouse/src/index'
import Placeholder from '../../placeholder/src/index'

/**
 * Component implementing a generic chart widget.
 *
 * @class Chart
 * @param type
 * @param name
 * @param parent
 * @param elem
 * @returns {{self: *, api: *}}
 */
export default (type, name, parent, elem) => {
  // Base component is Widget
  let { self, api } = compose(
    Widget(type, name, parent, elem),
    Font,
    Colors,
    Mouse,
    Tooltip,
    Placeholder
  )

  // Init default values
  self._chart = {
    plots: self._widget.content.append('g')
      .attr('class', 'dalian-plots-container'),
    plotSelectors: [],
    transition: false
  }

  // Protected methods
  self._chart.transformData = () => {}

  self._chart.plotGroups = (g, attr, duration = 700) => {
    // Select groups
    let groups = g.selectAll('.plot-group')
      .data(self._chart.data, d => d.name)

    // Exiting groups: simply fade out
    let exit = groups.exit()
      .transition().duration(duration)
      .style('opacity', 0)
      .remove()

    // Entering groups: starting transparent
    let enter = groups.enter().append('g')
      .attr('class', d => `plot-group ${encode(d.name)}`)
      .style('shape-rendering', 'geometricPrecision')
      .style('opacity', 0)
      .style('fill', 'transparent')
      .style('stroke', 'transparent')
    if (attr && attr.enter) {
      enter = attr.enter(enter)
    }

    // Union: attach mouse events
    let union = enter.merge(groups)
      .each(() => {
        // Disable pointer events before transition
        g.style('pointer-events', 'none')
        self._chart.transition = true
      })
      .on('mouseover', self._mouse.mouseover)
      .on('mouseleave', self._mouse.mouseleave)
      .on('click', self._mouse.click)
    if (attr && attr.union && attr.union.before) {
      union = attr.union.before(union)
    }

    // Animate new state
    let unionAnimated = union.transition().duration(duration)
      .style('opacity', 1)
      .style('fill', d => self._colors.mapping(d.name))
      .style('stroke', d => self._colors.mapping(d.name))
    if (attr && attr.union && attr.union.after) {
      unionAnimated = attr.union.after(unionAnimated)
    }
    unionAnimated.on('end', () => {
      // Re-enable pointer events
      g.style('pointer-events', 'all')
      self._chart.transition = false
    })

    return {
      groups: groups,
      enter: enter,
      exit: exit,
      union: {
        before: union,
        after: unionAnimated
      }
    }
  }

  // TODO Make highlight a separate component
  const _highlight = (selector, keys, duration = 0) => {
    // If currently animated, don't highlight
    if (self._chart.transition) {
      return api
    }

    // Stop current transitions
    let elems = self._chart.plots.selectAll(selector)
    elems.transition()

    // Perform highlight
    if (typeof keys === 'string') {
      // Single key
      elems.transition().duration(duration)
        .style('opacity', function () {
          return select(this).classed(encode(keys)) ? 1 : 0.1
        })
    } else if (Array.isArray(keys)) {
      // Multiple keys
      let keys = keys.map(d => encode(d))
      elems.transition().duration(duration)
        .style('opacity', function () {
          let elem = select(this)
          return keys.reduce((s, d) => s || elem.classed(d), false) ? 1 : 0.1
        })
    } else {
      // Remove highlight
      elems.transition().duration(duration || 0)
        .style('opacity', 1)
    }

    return api
  }

  self._chart.update = () => {
    // Adjust plots container
    self._chart.plots
      .attr('width', self._widget.size.innerWidth + 'px')
      .attr('height', self._widget.size.innerHeight + 'px')
      .attr('transform', 'translate(' + self._widget.margins.left + ',' + self._widget.margins.top + ')')
  }
  // Extend update
  self._widget.update = extend(self._widget.update, self._chart.update)

  // Public API
  api = Object.assign(api, {
    data: plots => {
      // Transform data to the standard internal structure
      self._chart.data = self._chart.transformData(plots)

      // Reset color mapping if it is set to default
      // TODO Is color mapping reset necessary?

      // Switch render flag
      return api
    },
    highlight: (keys, duration) => {
      self._chart.plotSelectors.forEach(d => _highlight(d, keys, duration))
      return api
    }
  })

  return { self, api }
}
