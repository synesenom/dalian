import Scale from '../components/scale'
import compose from '../core/compose'
import extend from '../core/extend'
import Chart from '../components/chart'
import PlotMarker from '../components/plot-marker'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'
import LeftAxis from '../components/axis/left-axis'
import BottomAxis from '../components/axis/bottom-axis'
import XRange from '../components/range/x-range'
import YRange from '../components/range/y-range'
import encode from '../core/encode'


// TODO Add tooltip
/**
 * The scatter plot widget. It extends the following components: [ElementTooltip]{@link ../components/point-tooltip.html}
 * under {.tooltip}.
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
    LeftAxis('y', scales.y),
    BottomAxis('x', scales.x),
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
      const sites = [];
      self._chart.data.forEach(function (d) {
        d.values.forEach(function (dd) {
          let site = [_.scales.x.scale(dd.x), _.scales.y.scale(dd.y)];
          site.name = d.name;
          sites.push(site);
        });
      });
      _.diagram = d3.voronoi()
        .extent([[0, 0], [parseInt(self._widget.size.innerWidth), parseInt(self._widget.size.innerHeight)]])(sites)
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
      // TODO Update marker only
      self._plotMarker.add(site.data[0], site.data[1], site.data.name, 1.5 * self._scatterPlot.size)
    }

    return {
      title: site.data.name,
      stripe: self._colors.mapping(site.data.name),
      content: {
        type: 'plots',
        data: [{
          name: self._bottomAxis.label(),
          value: site.data[0]
        }, {
          name: self._leftAxis.label(),
          value: site.data[1]
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
