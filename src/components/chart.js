import Colors from './colors'
import compose from '../core/compose'
import encode from '../core/encode'
import extend from '../core/extend'
import Description from './description'
import Font from './font'
import Mouse from './mouse'
import Placeholder from './placeholder'
import Widget from './widget'

// TODO Add xDomain(number[])
// TODO Add yDomain(number[])
// FIXME When highlight is on, newly entering plots are visible
// TODO Update plotGroups to use .join()
// TODO Bind mouse events to enter and update

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

      // Transform data: default is identity
      transformData: data => data,

      plotGroups: (attr, duration = 400) => {
        // Select groups
        let groups = self._chart.plots.selectAll('.plot-group')
          .data(self._chart.data, d => d.name)
          .join(
            enter => {
              let g = enter.append('g')
                .attr('class', d => `plot-group ${encode(d.name)}`)
                .style('shape-rendering', 'geometricPrecision')
                .style('fill', d => self._colors.mapping(d.name))
                .style('stroke', d => self._colors.mapping(d.name))
              return attr.enter ? attr.enter(g) : g
            },
            update => update,
            exit => exit.call(exit => {
              let g = exit.transition().duration(duration)
              g = attr.exit ? attr.exit(g) : g
              g.remove()
            })
          )
          .on('mouseover', self._mouse.mouseover)
          .on('mouseleave', self._mouse.mouseleave)
          .on('click', self._mouse.click)
          .each(() => {
            // Disable pointer events before transition
            self._chart.plots.style('pointer-events', 'none')
            self._widget.transition = true
          })
          .transition().duration(duration)
        groups = attr.update ? attr.update(groups) : groups
        groups.on('end', () => {
          // Re-enable pointer events
          self._chart.plots.style('pointer-events', 'all')
          self._widget.transition = false
        })
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

      // Switch render flag
      return api
    }
  })

  return { self, api }
}
