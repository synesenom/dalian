import { extent } from 'd3'
import compose from '../core/compose'
import encode from '../core/encode'
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


// TODO Add all components to docs: Highlight
// TODO Add more components: XGrid, YGrid.
/**
 * The scatter plot widget. Being a chart, it extends the [Chart]{@link ../components/chart} component, with all of its
 * available API. Furthermore, it extends the following components:
 * [BottomAxis]{@link ../components/bottom-axis.html},
 * [ElementTooltip]{@link ../components/point-tooltip.html},
 * [LeftAxis]{@link ../components/left-axis.html},
 * [Opacity]{@link ../components/opacity.html},
 * [XRange]{@link ../components/x-range.html},
 * [YRange]{@link ../components/y-range.html}.
 *
 * @function ScatterPlot
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] Parent element to append widget to.
 */
export default (name, parent = 'body') => {
  let scales = {
    x: Scale('linear'),
    y: Scale('linear')
  }
  let { self, api } = compose(
    Chart('scatter-plot', name, parent, 'svg'),
    BottomAxis(scales.x),
    ElementTooltip,
    Highlight(['.dot-group']),
    LeftAxis(scales.y),
    Opacity(0.5),
    PlotMarker,
    XRange,
    YRange
  )

  // Private members
  let _ = {
    // Variables
    diagram: undefined,
    scales,

    computeDiagram: data => {
      const sites = data.map(plot => plot.values.map(d => ({
          name: plot.name,
          x: d.x,
          y: d.y,
        })
      )).flat()
      return d3.voronoi()
        .x(d => _.scales.x.scale(d.x))
        .y(d => _.scales.y.scale(d.y))
        .extent([[0, 0], [parseInt(self._widget.size.innerWidth), parseInt(self._widget.size.innerHeight)]])(sites)
    },

    // Methods
    update: duration => {
      // Determine boundaries
      const flatData = self._chart.data.map(d => d.values).flat()

      // Update scales
      const xRange = extent(flatData.map(d => d.x))
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain(self._xRange.range([xRange[0] - self._scatterPlot.size, xRange[1] + self._scatterPlot.size]))
      const yRange = extent(flatData.map(d => d.y))
      _.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
        .domain(self._yRange.range([yRange[0] - self._scatterPlot.size, yRange[1] + self._scatterPlot.size]))

      // Add plots
      self._chart.plotGroups({
        enter: g => {
          // Init group
          g.style('opacity', 0)
            .attr('stroke', 'none')
            .attr('fill', 'currentColor')

          // Add dots
          g.selectAll('circle').data(d => d.values)
            .enter().append('circle')
            .attr('class', d => `dot ${encode(d.name)}`)
            .attr('cx', d => _.scales.x.scale(d.x))
            .attr('cy', d => _.scales.y.scale(d.y))
            .attr('r', self._scatterPlot.size)

          return g
        },
        updateBefore: g => {
          g.style('opacity', 1)

          g.selectAll('circle').data(d => d.values)
            .join(
              enter => enter.append('circle')
                .attr('class', d => `dot ${encode(d.name)}`)
                .attr('cx', d => _.scales.x.scale(d.x))
                .attr('cy', d => _.scales.y.scale(d.y))
                .attr('r', self._scatterPlot.size)
                .style('opacity', 0),
              update => update,
              exit => exit.transition().duration(duration)
                .style('opacity', 0)
                .remove()
            )
            .transition().duration(duration)
            .attr('cx', d => _.scales.x.scale(d.x))
            .attr('cy', d => _.scales.y.scale(d.y))
            .attr('r', self._scatterPlot.size)
            .style('opacity', self._opacity.value())

          return g
        },
        exit: g => g.style('opacity', 0)
      })

      // Update Voronoi tessellation.
      _.diagram = _.computeDiagram(self._chart.data)
    }
  }

  // Protected members
  self = Object.assign(self, {
    _scatterPlot: {
      size: 4
    }
  })

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
      self._plotMarker.add(_.scales.x.scale(site.data.x), _.scales.y.scale(site.data.y), 'marker', site.data.name,
        Math.max(5, 1.5 * self._scatterPlot.size))
    }

    return {
      title: site.data.name,
      stripe: self._colors.mapping(site.data.name),
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
      self._scatterPlot.size = value || 4
      return api
    }
  })
  return api
}
