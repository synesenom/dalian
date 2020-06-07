import compose from '../core/compose'
import encode from '../core/encode'
import extend from '../core/extend'
import copySvg from '../utils/copy-svg'
import copyToCanvas from '../utils/copy-to-canvas'
import download from '../utils/download'
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
 * <ul>
 *   <li><a href="../components/color.html">Color</a></li>
 *   <li><a href="../components/description.html">Description</a></li>
 *   <li><a href="../components/font.html">Font</a></li>
 *   <li><a href="../components/mouse.html">Mouse</a></li>
 *   <li><a href="../components/placeholder.html">Placeholder</a></li>
 * </ul>
 *
 * @function Chart
 */
export default (type, name, parent, elem = 'svg') => {
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
  const _ = (() => {
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

      // Methods.
      update (duration) {
        // Adjust clipper.
        self._widget.getElem(_.clip, duration)
          .attr('width', self._widget.size.innerWidth)
          .attr('height', self._widget.size.innerHeight)

        // Adjust plots container.
        self._widget.getElem(self._chart.plots, duration)
          .attr('width', self._widget.size.innerWidth + 'px')
          .attr('height', self._widget.size.innerHeight + 'px')
          .attr('transform', `translate(${self._widget.margins.left}, ${self._widget.margins.top})`)
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
      clipId: _.clipId,

      // Transform data: default is identity
      transformData: data => data,

      plotGroups (attr, duration) {
        // Select groups
        let groups = self._chart.plots.selectAll('.plot-group')
          .data(self._chart.data, d => d.name)
          .join(
            // Entering groups
            enter => {
              const g = enter.append('g')
                .attr('class', d => `plot-group ${encode(d.name)}`)
                .attr('clip-path', `url(#${_.clipId})`)
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
          .on('mouseover.chart', self._mouse.over)
          .on('mouseleave.chart', self._mouse.leave)
          .on('click.chart', self._mouse.click)
          .each(() => {
            // Disable pointer events before transition.
            self._chart.plots.style('pointer-events', 'none')
            self._widget.transition = true
          })
        // Update group before transition.
        groups = attr.updateBefore ? attr.updateBefore(groups) : groups

        // Transition update.
        groups = groups.transition().duration(duration)
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
    data: data => {
      // Transform data to the standard internal structure
      self._chart.data = self._chart.transformData(data)

      // Switch render flag
      return api
    },

    /**
     * Downloads the chart as a PNG file. At the moment, fonts are not embedded in the SVG and therefore the chart's
     * font (which is inherited from its parent) must be installed.
     *
     * @method download
     * @methodOf Chart
     * @param {string} filename Name of the file to download chart at (without extension).
     * @returns {Widget} Reference to the Widget API.
     * @async
     */
    download: async filename => {
      // Inspired by https://github.com/JuanIrache/d3-svg-to-png
      const svg = copySvg(self._widget.content.node())
      const file = await copyToCanvas(svg)
      download(file, filename, 'png')
    }
  })

  return { self, api }
}
