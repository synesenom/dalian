import Colors from '../../colors/src/index'
import { compose, encode, extend } from '../../../core/src/index'
import Description from '../../description/src/index'
import Font from '../../font/src/index'
import Mouse from '../../mouse/src/index'
import Placeholder from '../../placeholder/src/index'
import Widget from '../../widget/src/index'

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
    Colors,
    Description,
    Placeholder,
    Font,
    Mouse
  )

  // Private members
  let _ = {
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
            self._widget.transition = true
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
          self._widget.transition = false
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
    /**
     * Set/updates the data that is shown in the chart.
     *
     * @method data
     * @methodOf Chart
     * @param {Object[]} plots Array of objects representing the plots to show. Each plot has two properties:
     * <ul>
     *   <li>{string} name: Name of the plot.</li>
     *   <li>{Object[]} values: Plot data.</li>
     * </ul>
     * The {values} property is an array of objects of the following structure:
     * <ul>
     *   <li>{number} x: X coordinate of the data point.</li>
     *   <li>{number} y: Y coordinate of the data point.</li>
     *   <li>{number} [lo]: Optional lower error of the data point.</li>
     *   <li>{number} [hi]: Optional upper error of the data point.</li>
     * </ul>
     * @returns {Object} Reference to the Chart API.
     */
    data: plots => {
      // Transform data to the standard internal structure
      self._chart.data = self._chart.transformData(plots)

      // Switch render flag
      return api
    }
  })

  return { self, api }
}
