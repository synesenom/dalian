import { extent, max, voronoi } from 'd3'
import compose from '../core/compose'
import extend from '../core/extend'
import BottomAxis from '../components/axis/bottom-axis'
import Chart from '../components/chart'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'
import LeftAxis from '../components/axis/left-axis'
import Objects from '../components/objects'
import Opacity from '../components/opacity'
import Scale from '../components/scale'
import XRange from '../components/range/x-range'
import YRange from '../components/range/y-range'

/**
 * The bubble chart widget. Being a chart, it extends the [Chart]{@link ../components/chart.html} component, with all of
 * its available APIs. Furthermore, it extends the following components:
 * <ul>
 *   <li><a href="../components/bottom-axis.html">BottomAxis</a></li>
 *   <li><a href="../components/point-tooltip.html">ElementTooltip</a> The tooltip contains the X and Y values as well as the bubble size. The labels used in the tooltip are the axis labels for X and Y and 'size' for the size entry. These labels can be used to customize and format the tooltip entries.</li>
 *   <li>
 *     <a href="../components/highlight.html">Highlight</a> Bubbles can be highlighted by passing their names as
 *     specified in the data array.
 *   </li>
 *   <li><a href="../components/left-axis.html">LeftAxis</a></li>
 *   <li><a href="../components/objects.html">Objects</a></li>
 *   <li><a href="../components/opacity.html">Opacity</a></li>
 *   <li><a href="../components/x-range.html">XRange</a></li>
 *   <li><a href="../components/y-range.html">YRange</a></li>
 * </ul>
 *
 * @function BubbleChart
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
export default (name, parent = 'body') => {
  // Build widget from components
  const scales = {
    x: Scale(),
    y: Scale(),
    size: Scale('sqrt')
  }
  let { self, api } = compose(
    Chart('bubble-chart', name, parent),
    LeftAxis(scales.y),
    BottomAxis(scales.x),
    ElementTooltip,
    Highlight(() => self._chart.plots, ['.plot-group']),
    Objects(scales),
    Opacity(0.6),
    XRange,
    YRange
  )

  // Private methods.
  const computeDiagram = data => voronoi()
    .x(d => scales.x(d.value.x))
    .y(d => scales.y(d.value.y))
    .extent([[0, 0], [
      parseInt(self._widget.size.innerWidth),
      parseInt(self._widget.size.innerHeight)]
    ])(data)

  // Private members
  const _ = {
    current: {
      hovered: undefined,
      closest: undefined
    },
    diagram: undefined,
    radius: 30
  }

  // Overrides
  self._tooltip.content = mouse => {
    if (typeof mouse === 'undefined') {
      return
    }

    // Find closest site.
    const bubble = _.current.closest || _.current.hovered
    if (!bubble) {
      return
    }

    return {
      title: bubble.name,
      stripe: self._color.mapper(bubble),
      content: {
        data: [
          { name: self._bottomAxis.label.text(), value: bubble.value.x },
          { name: self._leftAxis.label.text(), value: bubble.value.y },
          { name: 'size', value: bubble.value.size }
        ]
      }
    }
  }

  self._chart.transformData = data => data.sort((a, b) => b.value.size - a.value.size)

  // Extend widget update
  self._widget.update = extend(self._widget.update, duration => {
    // Determine boundaries.
    // TODO Make this a utility.
    const flatData = self._chart.data.map(d => d.value).flat()

    // Update size scale.
    const sizeMax = max(flatData.map(d => d.size))
    scales.size.range([0, _.radius])
      .domain([0, sizeMax])

    // Init scales.
    // TODO Make this a utility as used by several places: ScatterPlot.
    let xRange = extent(flatData.map(d => d.x))
    scales.x.range([0, parseInt(self._widget.size.innerWidth)])
      .domain(xRange)
    let yRange = extent(flatData.map(d => d.y))
    scales.y.range([parseInt(self._widget.size.innerHeight), 0])
      .domain(yRange)

    // Adjust scales with sizes.
    xRange = flatData.map(d => {
      const dx = scales.x.measure(1.5 * scales.size(d.size))
      return [d.x - dx, d.x + dx]
    }).flat()
    scales.x.domain(self._xRange.range(xRange))
    yRange = flatData.map(d => {
      const dy = scales.y.measure(1.5 * scales.size(d.size))
      return [d.y - dy, d.y + dy]
    }).flat()
    scales.y.domain(self._yRange.range(yRange))

    // Add bubbles.
    self._chart.plotGroups({
      enter: g => {
        g.style('opacity', 0)
          .style('color', self._color.mapper)
          .on('mouseover.bubble', d => {
            // Update currently hovered.
            _.current.hovered = d

            // If there is no closest, call mouse over on hovered.
            if (typeof _.current.closest === 'undefined') {
              self._mouse.over(_.current.hovered)
            }
          })
          .on('mouseleave.bubble', () => {
            // If no current closest, call leave on hovered.
            if (typeof _.current.closest === 'undefined') {
              self._mouse.leave(_.current.hovered)
            }

            // Update hovered.
            _.current.hovered = undefined
          })
          // Remove chart mouse events.
          .on('mouseover.chart', null)
          .on('mouseleave.chart', null)

        // Add bubble.
        g.append('circle')
          .attr('class', 'bubble')
          .attr('cx', d => scales.x(d.value.x))
          .attr('cy', d => scales.y(d.value.y))
          .attr('r', d => Math.max(scales.size(d.value.size), 1))
          .attr('stroke', 'currentColor')
          .attr('fill', 'currentColor')
          .raise()

        return g
      },
      update: g => {
        g.style('opacity', 1)
          .style('color', self._color.mapper)

        // Update bubble.
        g.select('.bubble')
          .attr('cx', d => scales.x(d.value.x))
          .attr('cy', d => scales.y(d.value.y))
          .attr('r', d => Math.max(scales.size(d.value.size), 1))
          .attr('fill-opacity', self._opacity.value())

        return g
      },
      exit: g => g.style('opacity', 0)
    }, duration)

    // Update Voronoi tessellation.
    _.diagram = computeDiagram(self._chart.data)

    // Add event to detect hovering events.
    self._widget.container
      .on('mousemove.bubble', () => {
        // Find current bubble.
        const bubble = _.diagram.find(...self._widget.getMouse(), 20)
        const closest = (bubble && bubble.data) || undefined

        // If it's the same as the current closest, just do nothing.
        if (closest === _.current.closest) {
          return
        }

        if (typeof closest === 'undefined') {
          // If no bubble was found, call mouse leave on current closest and remove it.
          self._mouse.leave(_.current.closest)
          _.current.closest = undefined

          // If there is a hovered one, call mouse over on it.
          if (typeof _.current.hovered !== 'undefined') {
            self._mouse.over(_.current.hovered)
          }
        } else {
          // Bubble is found.

          // If currently hovered over a bubble, call leave on that one.
          if (typeof _.current.hovered !== 'undefined') {
            self._mouse.leave(_.current.hovered)
          }

          // Update closest and call mouse over.
          _.current.closest = closest
          self._mouse.over(_.current.closest)
        }
      })
      .on('click.bubble', () => {
        if (typeof _.current.closest !== 'undefined') {
          self._mouse.click(_.current.closest)
        }
      })
  }, true)

  // Public API.
  api = Object.assign(api || {}, {
    /**
     * Sets the maximum radius in pixels for the bubbles.
     *
     * @method radius
     * @methodOf BubbleChart
     * @param {number} [radius = 30] Maximum radius in pixels.
     * @returns {Object} Reference to the BubbleChart API.
     * @example
     *
     * // Set the maximum radius to 20px.
     * const bubbles = dalian.BubbleChart('my-chart')
     *   .radius(20)
     *   .render()
     *
     * // Reset maximum radius to default.
     * bubbles.radius()
     *   .render()
     */
    radius: (radius = 30) => {
      _.radius = radius
      return api
    }

    /**
     * Set/updates the chart data. Each bubble is a plot group in itself, so all methods that operate on plot groups are
     * applied on the bubble level.
     *
     * @method data
     * @methodOf BubbleChart
     * @param {Object[]} plots Array of objects representing the bubbles to show. Each bubble has two properties:
     * <dl>
     *   <dt>name</dt>  <dd>{string} Category name.</dd>
     *   <dt>value</dt> <dd>{Object} Category value.</dd>
     * </dl>
     * The <i>value</i> property is an object with the following structure:
     * <dl>
     *   <dt>x</dt>    <dd>{number} Horizontal coordinate of the bubble.</dd>
     *   <dt>y</dt>    <dd>{number} Vertical coordinate of the bubble.</dd>
     *   <dt>size</dt> <dd>{number} Bubble size. Note that the bubble is scaled so that its area will be
     *   proportional to this value.</dd>
     * </dl>
     * @returns {BubbleChart} Reference to the BubbleChart API.
     * @example
     *
     * const bubbles = dalian.BubbleChart('my-chart')
     *   .data([{
     *     name: 'bubble 1',
     *     value: {
     *       x: 1,
     *       y: 3,
     *       size: 1
     *     }
     *   }, {
     *     name: 'bubble 2',
     *     value: {
     *       x: 2,
     *       y: 2,
     *       size: 9
     *     }
     *   }])
     *   .render()
     */
  })

  return api
}
