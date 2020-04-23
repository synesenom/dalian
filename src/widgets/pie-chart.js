import { arc, interpolate, merge, pie } from 'd3'
import compose from '../core/compose'
import encode from '../core/encode'
import extend from '../core/extend'
import luminanceAdjustedColor from '../utils/luminance-adjusted-color'
import { attrTween, textTween } from '../utils/tween'
import Chart from '../components/chart'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'
import { measureText } from '../utils/measure-text'

// TODO Add outside values (with legs).
// TODO Add title.
// TODO Handle margins

export default (name, parent = 'body') => {
  let { self, api } = compose(
    Chart('pie-chart', name, parent, 'svg'),
    ElementTooltip,
    Highlight(['.plot-group']),
  )

  // Private members
  let _ = {
    // Style variables.
    innerRadius: 0,
    outerRadius: 100,
    values: false,
    valueFormat: x => x.toFixed(1),

    // Currently hovered wedge.
    current: undefined,

    // Arc function.
    arc: null,
    labelArc: null,

    // Methods
    measure: (d, style) => {
      const m = measureText(_.valueFormat(d.value), style)
      const textSize = Math.sqrt(m.width**2 + m.height**2)
      const angle = d.endAngle - d.startAngle
      const radius = 0.5 * (_.innerRadius + _.outerRadius)
      const sliceSize = Math.min(angle * radius,  _.outerRadius - _.innerRadius)
      return {
        inside: 1.5 * textSize < sliceSize
      }
    },

    update: duration => {
      // Compute some constants beforehand
      const style = self._widget.getStyle()

      // Create/update arc functions.
      _.arc = arc()
        .innerRadius(_.innerRadius)
        .outerRadius(_.outerRadius)
      _.labelArc = arc()
        .innerRadius(_.outerRadius)
        .outerRadius(_.outerRadius + 30)

      // Add plots.
      self._chart.plotGroups({
        enter: g => {
          g.style('opacity', 0)

          // Group of elements.
          let wedge = g.append('g')
            .attr('class', 'pie-slice')
            .attr('transform', `translate(${parseFloat(self._widget.size.width) / 2}, ${parseFloat(self._widget.size.height) / 2})`)
            .each(d => Object.assign(d, { _measures: _.measure(d, style) }))

          // Add slice.
          wedge.append('path')
            .attr('class', d => `slice ${encode(d.data.name)}`)
            .attr('d', _.arc)
            .attr('stroke-linejoin', 'round')
            .attr('stroke', 'white')
            .attr('fill', 'currentColor')

          // Add inside value.
          wedge.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'mathematical')
            .attr('x', d => _.arc.centroid(d)[0])
            .attr('y', d => _.arc.centroid(d)[1])
            .text(d => d.value.toFixed(1))
            .each(function (d) {
              this._current = d.value
            })

          // Add outside value.
          wedge.append('path')
            .attr('class', 'pie-label-line-r')
            .attr('stroke', '#000')
            .attr('d', d => {
              let p1 = _.arc.centroid(d)
              let p2 = _.labelArc.centroid(d)
              return `M${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]}`
            })
          // TODO Add outside value.

          return g
        },
        update: g => {
          g.style('opacity', 1)

          // Update slices.
          let wedge = g.select('.pie-wedge')
            .attr('transform', `translate(${parseFloat(self._widget.size.width) / 2}, ${parseFloat(self._widget.size.height) / 2})`)
            .each(d => Object.assign(d, { _measures: _.measure(d, style) }))

          wedge.select('.slice')
            .attrTween('d', attrTween(d => _.arc(d)))

          wedge.select('text')
            .attr('fill', d => d._measures.inside ? luminanceAdjustedColor(self._color.mapGroup(d.name)) : 'red')
            .attrTween('x', attrTween(d => _.arc.centroid(d)[0], 'x'))
            .attrTween('y', attrTween(d => _.arc.centroid(d)[1], 'y'))
            .textTween(textTween(_.valueFormat))

          wedge.select('.pie-label-line-r')
            .attrTween('d', attrTween(d => {
                let p1 = _.arc.centroid(d)
                let p2 = _.labelArc.centroid(d)
                return `M${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]}`
              }, 'r'))

          return g
        }
      }, duration)
    }
  }

  // Overrides
  // Transform data to pie chart compatible data.
  self._chart.transformData = data => {
    // Pie mapper.
    const pieFn = pie().value(d => d.value).sort(null)

    // Extend new data with exiting slices.
    let next = new Set(data.map(d => d.name))
    let exiting = self._chart.data.map(d => d.name)
      .filter(d => !next.has(d))
      .map(d => ({
        name: d,
        value: 0
      }))
    let newData = merge([data, exiting])
      .sort((a, b) => b.value - a.value)

    // Pie data.
    return pieFn(newData).map(d => Object.assign(d, { name: d.data.name }))
  }

  self._highlight.container = self._chart.plots

  self._tooltip.content = () => {
    // TODO ElementTooltip.
    // If no wedge is hovered, hide tooltip
    if (typeof _.current === 'undefined') {
      return
    }

    return {
      title: _.current.name,
      stripe: self._color.mapGroup(_.current.name),
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
  // Update plot before widget
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API
  api = Object.assign(api, {
    innerRadius: radius => {
      _.innerRadius = radius || 0
      return api
    },

    outerRadius: radius => {
      _.outerRadius = radius || 100
      return api
    },

    values: on => {
      _.values = on || false
      return api
    },

    valueFormat: format => {
      _.valueFormat = format || (x => x.toFixed(1))
      return api
    }
  })

  return api
}
