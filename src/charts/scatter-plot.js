import { extent, voronoi, max } from 'd3'
import { compose, extend } from '../core'
import {
  BottomAxis, Chart, ElementTooltip, Highlight, LeftAxis, Objects, Opacity, PlotMarker, Scale, XRange, YRange
} from '../components'

// Defaults.
const DEFAULTS = {
  size: () => 3
}

/**
 * The scatter plot widget. Being a chart, it extends the [Chart]{@link ../components/chart.html} component, with all of
 * its available APIs. Furthermore, it extends the following components:
 * <ul>
 *   <li><a href="../components/bottom-axis.html">BottomAxis</a></li>
 *   <li><a href="../components/point-tooltip.html">ElementTooltip</a></li>
 *   <li>
 *     <a href="../components/highlight.html">Highlight</a> Dot clouds can be highlighted by passing their plot names as
 *     specified in the data array.
 *   </li>
 *   <li><a href="../components/left-axis.html">LeftAxis</a></li>
 *   <li><a href="../components/line-width.html">Objects</a></li>
 *   <li><a href="../components/opacity.html">Opacity</a></li>
 *   <li><a href="../components/x-range.html">XRange</a></li>
 *   <li><a href="../components/y-range.html">YRange</a></li>
 * </ul>
 *
 * @function ScatterPlot
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
export default (name, parent = 'body') => {
  // Define scales.
  const scales = {
    x: Scale('linear'),
    y: Scale('linear')
  }

  // Build widget.
  let { self, api } = compose(
    Chart('scatter-plot', name, parent),
    BottomAxis(scales.x),
    ElementTooltip,
    Highlight(() => self._chart.plots, ['.plot-group']),
    LeftAxis(scales.y),
    Objects(scales),
    Opacity(0.6),
    PlotMarker,
    XRange,
    YRange
  )

  // Private methods.
  /**
   * Computes the Voronoi diagram for detecting the closest dot.
   *
   * @method computeDiagram
   * @memberOf ScatterPlot
   * @param {Object[]} data Plot data as described in the chart's data function.
   * @returns {Object} The D3 Voronoi object.
   * @private
   */
  function computeDiagram (data) {
    const sites = data.map(plot => plot.values.map(d => ({
      name: plot.name,
      x: d.x,
      y: d.y
    }))).flat()

    return voronoi()
      .x(d => _.scales.x(d.x))
      .y(d => _.scales.y(d.y))
      .extent([[0, 0], [parseInt(self._widget.size.innerWidth), parseInt(self._widget.size.innerHeight)]])(sites)
  }

  // Private members
  const _ = {
    // Variables
    scales,
    current: undefined,
    diagram: undefined,

    // UI variables.
    size: DEFAULTS.size
  }

  // Overrides.
  self._tooltip.content = mouse => {
    if (typeof mouse === 'undefined') {
      self._plotMarker.remove()
      return
    }

    // Find closest sites
    if (!_.current) {
      self._plotMarker.remove()
      return
    } else {
      self._plotMarker.add(_.scales.x(_.current.x), _.scales.y(_.current.y), 'marker', _.current,
        Math.max(5, 1.5 * _.size(_.current)))
    }

    return {
      title: _.current.name,
      stripe: self._color.mapper(_.current),
      content: {
        type: 'plots',
        data: [{
          name: self._bottomAxis.label.text(),
          value: _.current.x
        }, {
          name: self._leftAxis.label.text(),
          value: _.current.y
        }]
      }
    }
  }

  self._chart.transformData = data => {
    // Just make sure we convert strings to numbers.
    return data.map(d => ({
      name: d.name,
      values: d.values.map(dd => Object.assign(dd, {
        name: d.name,
        x: +dd.x,
        y: +dd.y
      }))
    }))
  }

  // Extend widget update
  self._widget.update = extend(self._widget.update, duration => {
    // Determine boundaries.
    const flatData = self._chart.data.map(d => d.values).flat()
    const maxSize = max(flatData.map(_.size))

    // Init scales.
    _.scales.x.range([0, parseInt(self._widget.size.innerWidth)])
      .domain(extent(flatData.map(d => d.x).flat()))
    _.scales.y.range([parseInt(self._widget.size.innerHeight), 0])
      .domain(extent(flatData.map(d => d.y).flat()))

    // Adjust for size _after_ the data based initialization is done.
    const xRange = extent(flatData.map(d => {
      const size = _.scales.x.measure(_.size(d))
      return [d.x - size, d.x + size]
    }).flat())
    _.scales.x.domain(self._xRange.range(xRange))
    const yRange = extent(flatData.map(d => {
      const size = _.scales.y.measure(_.size(d))
      return [d.y - size, d.y + size]
    }).flat())
    _.scales.y.domain(self._yRange.range(yRange))

    // Add plots.
    self._chart.plotGroups({
      enter: g => {
        // Init group
        g.style('opacity', 0)

        // Add dots
        g.selectAll('circle').data(d => d.values)
          .enter().append('circle')
          .attr('class', 'dot')
          .attr('cx', d => _.scales.x(d.x))
          .attr('cy', d => _.scales.y(d.y))
          .attr('r', _.size)
          .style('opacity', 0)
          .style('fill', self._color.mapper)
          .attr('stroke', 'none')

        return g
      },
      updateBefore: g => {
        g.style('opacity', 1)

        g.selectAll('circle')
          .data(d => d.values)
          .join(
            enter => enter.append('circle')
              .attr('class', 'dot')
              .attr('cx', d => _.scales.x(d.x))
              .attr('cy', d => _.scales.y(d.y))
              .attr('r', _.size)
              .style('opacity', 0),
            update => update,
            exit => exit.transition().duration(duration)
              .style('opacity', 0)
              .remove()
          )
          .transition().duration(duration)
          .attr('cx', d => _.scales.x(d.x))
          .attr('cy', d => _.scales.y(d.y))
          .attr('r', _.size)
          .style('opacity', self._opacity.value())
          .style('fill', self._color.mapper)

        return g
      },
      exit: g => g.style('opacity', 0)
    })

    // Update Voronoi tessellation.
    _.diagram = computeDiagram(self._chart.data)

    // Add event to detect hovering events.
    self._widget.container
      .on('mousemove.scatter', () => {
        const dot = _.diagram.find(...self._widget.getMouse(), Math.max(20, maxSize)) || undefined

        // Mouse events.
        if (typeof dot !== 'undefined' && dot !== _.current) {
          // If bubble is different from current closest, call mouseover.
          self._mouse.over(dot.data)
        } else if (typeof _.current !== 'undefined') {
          self._mouse.leave(_.current)
        }

        // Update current closest.
        _.current = (dot && dot.data) || undefined
      })
      .on('click.scatter', () => {
        if (typeof _.current !== 'undefined') {
          self._mouse.click(_.current)
        }
      })
  }, true)

  // Public API
  api = Object.assign(api, {
    /**
     * Sets the circles' radius in pixels. Default value is 4.
     *
     * @method size
     * @memberOf ScatterPlot
     * @param {(number|Function)} [value = 3] Radius of the circles to set in pixels. Either a number or a function
     * mapping from a data point to a number.
     * @returns {Object} Reference to the ScattePlot's API.
     * @example
     *
     * // Set dot size to 2px.
     * const scatter = dalian.ScatterPlot('my-chart')
     *   .size(2)
     *   .render()
     *
     * // Reset size to default.
     * scatter.size()
     *   .render()
     */
    size: (value = DEFAULTS.size) => {
      _.size = typeof value === 'number' ? () => value : value
      return api
    }

    /**
     * Set/updates the data that is shown in the scatter plot.
     *
     * @method data
     * @memberOf ScatterPlot
     * @param {Object[]} plots Array of objects representing the dot clouds to show. Each plot has two properties:
     * <dl>
     *   <dt>name</dt>   <dd>{string} Name of the plot.</dd>
     *   <dt>values</dt> <dd>{Object[]} Plot data.</dd>
     * </dl>
     * The {values} property is an array of objects of the following structure:
     * <dl>
     *   <dt>x</dt>     <dd>{number} X coordinate of the data point.</dd>
     *   <dt>y</dt>     <dd>{number} Y coordinate of the data point.</dd>
     *   <dt>label</dt> <dd>{(number|string)} An optional label that is used for distinguishing the dots during updates.</dd>
     * </dl>
     * @returns {ScatterPlot} Reference to the ScatterPlot API.
     * @example
     *
     * const scatter = dalian.ScatterPlot('my-chart')
     *   .data([{
     *     name: 'sample 1',
     *     values: [
     *       {x: 1.3, y: 2.3},
     *       {x: 1.4, y: 2.1},
     *       {x: 5.3, y: -2.3},
     *       ...
     *     ]
     *   }, {
     *     name: 'sample 2',
     *     values: [
     *       {x: 2.5, y: 7.1},
     *       {x: 3.8, y: 5.3},
     *       {x: 1.7, y: 2.4},
     *       ...
     *     ]
     *   } ... ])
     *   .render()
     */
  })
  return api
}
