import { arc, pie } from 'd3'
import compose from '../core/compose'
import Chart from '../components/chart'
import Scale from '../components/scale'
import Highlight from '../components/highlight'
import ElementTooltip from '../components/tooltip/element-tooltip'
import extend from '../core/extend'
import encode from '../core/encode'

// TODO Add .title() to widget
// TODO value
// TODO valueFormat
// TODO Add outside values
// TODO innerRadius
// TODO outerRadius
// TODO Animation with arcTween
// TODO Handle margins

export default (name, parent = 'body') => {
  let scale = Scale('linear')
  let { self, api } = compose(
    Chart('pie-chart', name, parent, 'svg'),
    ElementTooltip,
    Highlight
  )

  // Private members
  let _ = {
    // Variables
    current: undefined,

    // Methods
    arcTween: (that, a) => {
      const i = d3.interpolate(that._current, a)
      that._current = i(1)
      return (t) => arc(i(t))
    },

    update: duration => {
      // Create arc and pie
      const arcFn = arc()
        .innerRadius(0)
        .outerRadius(self._pieChart.outerRadius)
      const pieFn = pie().value(d => d.value)
        .sort(null)

      // Add plots
      // TODO Add exit transition
      /* self._chart.plotGroups({
        enter: g => {
          // Apply pie transformation on data and add name as direct property to make sure colors are mapped
          g.data(pieFn(self._chart.data)
            .map(d => Object.assign(d, {
              name: d.data.name
            })), d => d.name)
            .attr('transform', `translate(${parseFloat(self._widget.size.width) / 2}, ${parseFloat(self._widget.size.height) / 2})`)

          // Slices
          g.append('path')
            .attr('class', d => `slice ${encode(d.name)}`)
            .style('stroke', 'none')
            .on('over', d => _.current = d)
            .on('leave', () => _.current = undefined)
            .attr('d', arcFn)
          return g
        },
        union: {
          before: g => {
            // Transform data
            // TODO Move data transformation to transformData method
            g.data(pieFn(self._chart.data)
              .map(d => Object.assign(d, {
                name: d.data.name
              })), d => d.name)
            g.select('.slice')
              .each(function(d) { this._current = d })
            return g
          },
          after: g => {
            // Slices
            g.select('.slice')
              .attr('d', d => {
                console.log(arcFn(d))
                return arcFn(d)
              })
            return g
          }
        }
      }) */
    }
  }

  // Protected members
  self = Object.assign(self, {
    _pieChart: {
      // TODO Setter
      // TODO Docs
      innerRadius: 10,
      // TODO Setter
      // TODO Docs
      outerRadius: 50,
      values: false,
      valueFormat: Math.round
    }
  })

  // Overrides
  self._highlight.container = self._chart.plots

  self._highlight.selectors = ['.slice']// TODO ['.pie', '.pie-marker']

  self._tooltip.content = () => {
    // If no bar is hovered, hide tooltip
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
    values: on => {
      self._pieChart.values = on
      return api
    },

    valueFormat: format => {
      self._pieChart.valueFormat = format
      return api
    }
  })

  return api
}
