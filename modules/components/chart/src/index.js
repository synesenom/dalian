import { select } from 'd3-selection'
import { compose, encode, extend } from '../../../core/src/index'
import Widget from '../../widget/src/index'
import Font from '../../font/src/index'
import Colors from '../../colors/src/index'
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
    Placeholder
  )

  // Private members
  let _ = {
    // Variables
    transition: false,

    // Methods
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
    }
  })

  return { self, api }
}
