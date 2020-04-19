import compose from '../core/compose'
import encode from '../core/encode'
import extend from '../core/extend'
import Color from './color'
import Description from './description'
import Font from './font'
import Mouse from './mouse'
import Placeholder from './placeholder'
import Widget from './widget'

// FIXME When highlight is on, newly entering plots are visible
/**
 * Component implementing a generic chart widget. It extends the [Widget]{@link ../components/widget.html} component
 * with all of its available APIs. It extends the following components:
 * [Color]{@link ../components/color.html},
 * [Description]{@link ../components/description.html},
 * [Font]{@link ../components/font.html},
 * [Mouse]{@link ../components/mouse.html},
 * [Placeholder]{@link ../components/placeholder.html}.
 *
 * @function Chart
 */
export default (type, name, parent, elem) => {
  // Build component from other components
  let { self, api } = compose(
    Widget(type, name, parent, elem),
    Color,
    Description,
    Placeholder,
    Font,
    Mouse
  )

  // Private members
  let _ = (() => {
    const clipId = `${name}-dalian-plots-clipper`

    return {
      clipId,
      clip: self._widget.content.append('defs').append('clipPath')
        .attr('id', clipId)
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', self._widget.size.innerWidth)
        .attr('height', self._widget.size.innerHeight),

      // Methods
      update: duration => {
        // Adjust clipper
        self._widget.get(_.clip, duration)
          .attr('width', self._widget.size.innerWidth)
          .attr('height', self._widget.size.innerHeight)

        // Adjust plots container
        self._widget.get(self._chart.plots, duration)
          .attr('width', self._widget.size.innerWidth + 'px')
          .attr('height', self._widget.size.innerHeight + 'px')
          .attr('transform', 'translate(' + self._widget.margins.left + ',' + self._widget.margins.top + ')')
      }
    }
  })()

  // Protected members
  self = Object.assign(self || {}, {
    _chart: {
      // Variables
      data: [],
      plots: self._widget.content.append('g')
        .attr('class', 'dalian-plots-container'),
      plotSelectors: [],
      clipId: _.clipId,

      // Transform data: default is identity
      transformData: data => data,

      plotGroups: (attr, duration) => {
        // Select groups
        let groups = self._chart.plots.selectAll('.plot-group')
          .data(self._chart.data, d => d.name)
          .join(
            // Entering groups
            enter => {
              let g = enter.append('g')
                .attr('class', d => `plot-group ${encode(d.name)}`)
                .attr('clip-path', `url(#${_.clipId})`)
                .style('color', d => self._color.mapGroup(d.name))
                .style('shape-rendering', 'geometricPrecision')
              return attr.enter ? attr.enter(g) : g
            },
            // Group update: do nothing
            update => update,
            exit => {
              let g = exit.transition().duration(duration)
              g = attr.exit ? attr.exit(g) : g
              g.remove()
            })
          .on('mouseover.mouse', self._mouse.over)
          .on('mouseleave.mouse', self._mouse.leave)
          .on('click.mouse', self._mouse.click)
          .each(() => {
            // Disable pointer events before transition.
            self._chart.plots.style('pointer-events', 'none')
            self._widget.transition = true
          })
        // Update group before transition.
        groups = attr.updateBefore ? attr.updateBefore(groups) : groups

        // Transition update.
        groups = groups.transition().duration(duration)
          .style('color', d => self._color.mapGroup(d.name))
        groups = attr.update ? attr.update(groups) : groups

        // At the end, restore pointer events.
        groups.on('end', () => {
          // Enable pointer events if any of the followings hold:
          // - Mouse events are enabled.
          // - Tooltip is enabled.
          self._chart.plots.style('pointer-events',
            ((self._tooltip && self._tooltip.isOn()) || self._mouse.hasAny()) ? 'all' : 'none')
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
