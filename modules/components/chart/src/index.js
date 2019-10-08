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
  // Build component from other components
  let { self, api } = compose(
    Widget(type, name, parent, elem),
    Font,
    Colors,
    Mouse,
    Tooltip,
    Placeholder
  )

  // Private members
  let _ = {
    // Variables
    transition: false,

    // Methods
    // TODO Make highlight a separate component
    highlight: (selector, keys, duration = 0) => {
      // If currently animated, don't highlight
      if (_.transition) {
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
    },

    update: () => {
      // Adjust plots container
      self._chart.plots
        .attr('width', self._widget.size.innerWidth + 'px')
        .attr('height', self._widget.size.innerHeight + 'px')
        .attr('transform', 'translate(' + self._widget.margins.left + ',' + self._widget.margins.top + ')')
    }
  }

  // Protected members
  self = Object.assign(self, {
    _chart: {
      // Variables
      plots: self._widget.content.append('g')
        .attr('class', 'dalian-plots-container'),
      plotSelectors: [],

      // Methods
      transformData: () => undefined,

      tooltipContent: () => undefined,

      plotGroups: (attr, duration = 700) => {
        // Select groups
        let groups = self._chart.plots.selectAll('.plot-group')
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
            self._chart.plots.style('pointer-events', 'none')
            _.transition = true
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
          self._chart.plots.style('pointer-events', 'all')
          _.transition = false
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
    }
  })

  // Overridden methods
  self._tooltip.createContent = mouse => {
    let content = self._chart.tooltipContent(mouse)
    if (typeof content === 'undefined') {
      return undefined
    }

    // Create content node
    let contentNode = select(document.createElement('div'))
      .style('border-radius', '2px')
      .style('padding', '5px')
      .style('font-family', 'Courier')

    // Add title
    contentNode
      .append('div')
      .style('position', 'relative')
      .style('width', 'calc(100% - 10px)')
      .style('line-height', '11px')
      .style('margin', '5px')
      .style('margin-bottom', '10px')
      .text(self._tooltip.titleFormat(content.title))

    // Add color
    contentNode.style('border-left', content.stripe ? 'solid 2px ' + content.stripe : null)

    // Add content
    switch (content.content.type) {
      case 'metrics':
        // List of metrics
        content.content.data.forEach(row => {
          let entry = contentNode.append('div')
            .style('position', 'relative')
            .style('display', 'block')
            .style('width', 'auto')
            .style('height', '10px')
            .style('margin', '5px')
          entry.append('div')
            .style('position', 'relative')
            .style('float', 'left')
            .style('color', '#888')
            .html(row.label);
          entry.append('div')
            .style('position', 'relative')
            .style('float', 'right')
            .style('margin-left', '10px')
            .html(row.value)
        })
        break
      case 'plots':
        // List of plots
        content.content.data.sort((a, b) => a.name.localeCompare(b.name))
          .forEach(plot => {
            let entry = contentNode.append('div')
              .style('position', 'relative')
              .style('max-width', '150px')
              .style('height', '10px')
              .style('margin', '5px')
              .style('padding-right', '10px')
            let square = entry.append('div')
              .style('position', 'relative')
              .style('width', '9px')
              .style('height', '9px')
              .style('float', 'left')
              .style('background', plot.background)
            // TODO Move this to LineStyles
            entry.append('span')
              .style('position', 'relative')
              .style('width', 'calc(100% - 20px)')
              .style('height', '10px')
              .style('float', 'right')
              .style('line-height', '11px')
              .html(plot.value)
          })
        break
    }

    return contentNode.node().outerHTML
  }

  // Extend update
  self._widget.update = extend(self._widget.update, _.update)

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
      self._chart.plotSelectors.forEach(d => _.highlight(d, keys, duration))
      return api
    }
  })

  return { self, api }
}
