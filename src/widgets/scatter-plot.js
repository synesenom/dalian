import { extent, voronoi } from 'd3'
import compose from '../core/compose'
import extend from '../core/extend'
import Chart from '../components/chart'
import BottomAxis from '../components/axis/bottom-axis'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'
import LeftAxis from '../components/axis/left-axis'
import Opacity from '../components/opacity'
import PlotMarker from '../components/plot-marker'
import Scale from '../components/scale'
import XRange from '../components/range/x-range'
import YRange from '../components/range/y-range'

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
 *   <li><a href="../components/opacity.html">Opacity</a></li>
 *   <li><a href="../components/x-range.html">XRange</a></li>
 *   <li><a href="../components/y-range.html">YRange</a></li>
 * </ul>
 *
 * @function ScatterPlot
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] Query selector of the parent element to append widget to.
 */
export default (name, parent = 'body') => {
  let scales = {
    x: Scale('linear'),
    y: Scale('linear')
  }
  let { self, api } = compose(
    Chart('scatter-plot', name, parent),
    BottomAxis(scales.x),
    ElementTooltip,
    Highlight(['.plot-group']),
    LeftAxis(scales.y),
    Opacity(0.6),
    PlotMarker,
    XRange,
    YRange
  )

  // Private members
  let _ = {
    // Variables
    scales,
    diagram: undefined,

    // UI variables.
    size: 4,

    // Calculations.
    computeDiagram: data => {
      const sites = data.map(plot => plot.values.map(d => ({
        name: plot.name,
        x: d.x,
        y: d.y
      })
      )).flat()

      return voronoi()
        .x(d => _.scales.x.scale(d.x))
        .y(d => _.scales.y.scale(d.y))
        .extent([[0, 0], [parseInt(self._widget.size.innerWidth), parseInt(self._widget.size.innerHeight)]])(sites)
    },

    // Update method.
    update: duration => {
      // Determine boundaries.
      const flatData = self._chart.data.map(d => d.values).flat()

      // Init scales.
      const xRange = extent(flatData.map(d => d.x))
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain(xRange)
      const yRange = extent(flatData.map(d => d.y))
      _.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
        .domain(yRange)

      // Adjust scales to fit circles within the axes.
      const dx = _.scales.x.measure(2 * _.size)
      _.scales.x.domain(self._xRange.range([xRange[0] - dx, xRange[1] + dx]))
      const dy = _.scales.y.measure(2 * _.size)
      _.scales.y.domain(self._yRange.range([yRange[1] + dy, yRange[0] - dy]))

      // Add plots.
      self._chart.plotGroups({
        enter: g => {
          // Init group
          g.style('opacity', 0)
            .style('color', self._color.mapper)
            .attr('stroke', 'none')
            .attr('fill', 'currentColor')

          // Add dots
          g.selectAll('circle').data(d => d.values)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('cx', d => _.scales.x.scale(d.x))
            .attr('cy', d => _.scales.y.scale(d.y))
            .attr('r', _.size)
            .style('opacity', 0)

          return g
        },
        updateBefore: g => {
          g.style('opacity', 1)
            .style('color', self._color.mapper)

          g.selectAll('circle')
            .data(d => d.values)
            .join(
              enter => enter.append('circle')
                .attr('class', 'dot')
                .attr('cx', d => _.scales.x.scale(d.x))
                .attr('cy', d => _.scales.y.scale(d.y))
                .attr('r', _.size)
                .style('opacity', 0),
              update => update,
              exit => exit.transition().duration(duration)
                .style('opacity', 0)
                .remove()
            )
            .transition().duration(duration)
            .attr('cx', d => _.scales.x.scale(d.x))
            .attr('cy', d => _.scales.y.scale(d.y))
            .attr('r', _.size)
            .style('opacity', self._opacity.value())

          return g
        },
        exit: g => g.style('opacity', 0)
      })

      // Update Voronoi tessellation.
      _.diagram = _.computeDiagram(self._chart.data)
    }
  }

  // Overrides
  self._highlight.container = self._chart.plots

  self._tooltip.content = mouse => {
    if (typeof mouse === 'undefined') {
      self._plotMarker.remove()
      return
    }

    // Find closest sites
    const site = _.diagram.find(mouse[0], mouse[1], 20)
    if (!site) {
      self._plotMarker.remove()
      return
    } else {
      self._plotMarker.add(_.scales.x.scale(site.data.x), _.scales.y.scale(site.data.y), 'marker', site.data,
        Math.max(5, 1.5 * _.size))
    }

    return {
      title: site.data.name,
      stripe: self._color.mapper(site.data),
      content: {
        type: 'plots',
        data: [{
          name: self._bottomAxis.label(),
          value: site.data.x
        }, {
          name: self._leftAxis.label(),
          value: site.data.y
        }]
      }
    }
  }

  self._chart.transformData = data => {
    // Just make sure we convert strings to numbers.
    return data.map(d => ({
      name: d.name,
      values: d.values.map(dd => ({
          x: +dd.x,
          y: +dd.y,
        }))
    }))
  }

  // Extend widget update
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API
  api = Object.assign(api, {
    /**
     * Sets the circles' radius in pixels. Default value is 4.
     *
     * @method size
     * @methodOf ScatterPlot
     * @param {number} [value = 4] Radius of the circles to set in pixels
     * @returns {Object} Reference to the ScattePlot's API.
     */
    size: value => {
      _.size = value || 4
      return api
    }
  })
  return api

  // Documentation.
  /**
   * Set/updates the data that is shown in the scatter plot.
   *
   * @method data
   * @methodOf ScatterPlot
   * @param {Object[]} plots Array of objects representing the dot clouds to show. Each plot has two properties:
   * <ul>
   *   <li>{string} <i>name</i>: Name of the plot.</li>
   *   <li>{Object[]} <i>values</i>: Plot data.</li>
   * </ul>
   * The <i>values</i> property is an array of objects of the following structure:
   * <dl>
   *   <dt>x {number}</dt> <dd>X coordinate of the data point.</dd>
   *   <dt>y {number}</dt> <dd>Y coordinate of the data point.</dd>
   *   <dt>label {(number|string)}</dt> <dd>An optional label that is used for distinguishing the dots during updates.</dd>
   * </dl>
   * @returns {ScatterPlot} Reference to the ScatterPlot API.
   */
}

// TODO Data
