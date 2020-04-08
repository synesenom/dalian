import compose from '../core/compose'
import encode from '../core/encode'
import extend from '../core/extend'
import Chart from '../components/chart'
import BottomAxis from '../components/axis/bottom-axis'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'
import LeftAxis from '../components/axis/left-axis'
import PlotMarker from '../components/plot-marker'
import Scale from '../components/scale'
import XRange from '../components/range/x-range'
import YRange from '../components/range/y-range'


// TODO Add all components to docs: Highlight, XRange, YRange
/**
 * The scatter plot widget. Being a chart, it extends the [Chart]{@link ../components/chart} component, with all of its
 * available API. Furthermore, it extends the following components:
 * [BottomAxis]{@link ../components/bottom-axis.html},
 * [LeftAxis]{@link ../components/left-axis.html},
 * [ElementTooltip]{@link ../components/point-tooltip.html}.
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
    LeftAxis(scales.y),
    BottomAxis(scales.x),
    YRange,
    XRange,
    PlotMarker,
    ElementTooltip,
    Highlight(['.dot-group'])
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
      // TODO Add these methods to utils as they are duplicated everywhere
      const flatData = self._chart.data.reduce((acc, d) => acc.concat(d.values), [])
      const xData = flatData.map(d => d.x)
      const yData = flatData.map(d => d.y)
      const xMin = self._xRange.min(xData) - self._scatterPlot.size
      const xMax = self._xRange.max(xData) + self._scatterPlot.size
      const yMin = self._yRange.min(yData) - self._scatterPlot.size
      const yMax = self._yRange.max(yData) + self._scatterPlot.size

      // Update scales
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain([xMin, xMax])
      _.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
        .domain([yMin, yMax])

      // Add plots
      self._chart.plotGroups({
        enter: g => {
          // Init group
          g.style('stroke', 'none')
            .style('fill-opacity', 0)

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
          g.style('fill-opacity', 1)

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
            .style('opacity', 1)

          return g
        },
        exit: g => g.style('opacity', 0)
      })

      // Update Voronoi tessellation
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
    const site = _.diagram.find(mouse[0], mouse[1], 10)
    if (!site) {
      self._plotMarker.remove()
      return
    } else {
      self._plotMarker.add(_.scales.x.scale(site.data.x), _.scales.y.scale(site.data.y), 'marker',
        site.data.name, 1.5 * self._scatterPlot.size)
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
    size: value => {
      self._scatterPlot.size = value
      return api
    }
  })
  return api
}