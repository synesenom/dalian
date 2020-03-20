import Scale from '../components/scale'
import compose from '../core/compose'
import extend from '../core/extend'
import Chart from '../components/chart'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'
import LeftAxis from '../components/axis/left-axis'
import BottomAxis from '../components/axis/bottom-axis'
import XRange from '../components/range/x-range'
import YRange from '../components/range/y-range'
import encode from '../core/encode'


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
    ElementTooltip,
    Highlight(['.dot-group']),
    LeftAxis('y', scales.y),
    BottomAxis('x', scales.x),
    YRange,
    XRange
  )

  // Private members
  let _ = {
    // Variables
    current: undefined,
    scales,

    // Methods
    update: duration => {
      // Determine boundaries
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
      let dots;
      self._chart.plotGroups({
        enter: g => {
          // Init group
          g.style('stroke', 'none')
            .style('fill-opacity', 0)

          // Add dots
          dots = g.selectAll('circle')
            .data(d => d.values)

          dots.enter().append('circle')
            .attr('class', d => `dot ${encode(d.name)}`)
            .attr('cx', d => _.scales.x.scale(d.x))
            .attr('cy', d => _.scales.y.scale(d.y))
            .attr('r', self._scatterPlot.size)

          /*g.selectAll('circle')
            .data(d => d.values)
            .join(
              enter => {
                /*enter.append('circle')
                  .attr('class', d => `dot ${encode(d.name)}`)
                  .attr('cx', d => _.scales.x.scale(d.x))
                  .attr('cy', d => _.scales.y.scale(d.y))
                  .attr('r', self._scatterPlot.size)
                  .style('opacity', 0)
                console.log(enter)
                return enter
              }/*,
              update: gg => {
                gg.selectAll('.dot')
                  .transition().duration(duration)
                  .attr('cx', d => _.scales.x.scale(d.x))
                  .attr('cy', d => _.scales.y.scale(d.y))
                  .style('opacity', 1)
                return gg
              },
              exit: gg => {
                gg.selectAll('.dot')
                  .transition().duration(duration)
                  .style('opacity', 0)
                  .remove()
                return gg
              }
            )*/
            //.transition().duration(duration)
            //.style('opacity', 1)

          return g
        },
        update: g => {
          g.style('fill-opacity', 1)

          dots = dots.data(d => {
            console.log(d)
            return d.values
          })

          dots.exit()
            .transition().duration(duration)
            .style('opacity', 0)
            .remove()

          dots.enter().append('circle')
            .attr('class', d => `dot ${encode(d.name)}`)
            .attr('cx', d => _.scales.x.scale(d.x))
            .attr('cy', d => _.scales.y.scale(d.y))

          return g
        },
        exit: g => g.style('opacity', 0)
      })
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

  self._tooltip.content = () => {
    // If no bar is hovered, hide tooltip
    if (typeof _.current === 'undefined') {
      return
    }

    return {
      title: _.current.name,
      stripe: self._colors.mapping(_.current.name),
      content: {
        type: 'plots',
        data: [{
          name: 'value',
          value: _.current.value
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
