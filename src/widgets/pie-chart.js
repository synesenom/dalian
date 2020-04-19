import { arc, descending, interpolate, merge, pie } from 'd3'
import compose from '../core/compose'
import encode from '../core/encode'
import extend from '../core/extend'
import Chart from '../components/chart'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'

// TODO Add values.
// TODO Add valueFormat.
// TODO Add outside values (with legs).
// TODO Add proper transition.
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

    // Currently hovered wedge.
    current: undefined,

    // Arc function.
    arc: null,

    // Methods
    arcTween(d) {
      let i = interpolate(this._current, d)
      this._current = i(0)
      return t => _.arc(i(t))
    },

    update: duration => {
      // Create/update arc function.
      _.arc = arc()
        .innerRadius(_.innerRadius)
        .outerRadius(_.outerRadius)

      // Add plots.
      self._chart.plotGroups({
        enter: g => {
          // Add slice.
          g.append('path')
            .attr('class', d => `slice ${encode(d.data.name)}`)
            .attr('d', _.arc({
              startAngle: 0,
              endAngle: 0
            }))
            .each(function (d) {
              this._current = {
                data: d.data,
                value: d.value,
                startAngle: 0,
                endAngle: 0
              }
            })
            .attr('stroke-linejoin', 'round')
            .attr('stroke', 'white')
            .attr('fill', 'currentColor')
            .attr('transform', `translate(${parseFloat(self._widget.size.width) / 2}, ${parseFloat(self._widget.size.height) / 2})`)

          return g
        },
        update: g => {
          // Update to new arc.
          g.select('.slice')
            .attrTween('d', _.arcTween)

          return g
        }
      }, duration)
    }
  }

  // Overrides
  // Transform data to pie chart compatible data.
  self._chart.transformData = data => {
    // Pie mapper.
    const pieFn = pie().value(d => d.value)
      .sort(null)

    // If data is empty, just assign to new data.
    let pieData
    if (self._chart.data.length === 0) {
      // If first data set.
      pieData = data//.sort((a, b) => descending(a.name, b.name))
    } else {
      // Otherwise calculate union with new data.
      let next = new Set(data.map(d => d.name))
      let remove = self._chart.data.map(d => d.name)
        .filter(d => !next.has(d))
        .map(d => ({
          name: d,
          value: 0
        }))
      pieData = merge([data, remove])
    }

    // Add plot group name.
    return pieFn(pieData.sort((a, b) => descending(a.name, b.name)))
      .map(d => Object.assign(d, { name: d.data.name }))
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
    }
    // TODO values.
    // TODO valueFormat.
  })

  return api
}
