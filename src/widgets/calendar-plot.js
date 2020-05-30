import { extent, min, max, sum, scaleLinear, select, timeParse } from 'd3'
import compose from '../core/compose'
import extend from '../core/extend'
import brightnessAdjustedColor from '../utils/brightness-adjusted-color'
import Chart from '../components/chart'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'
import Label from '../components/label'
import LeftAxis from '../components/axis/left-axis'
import Scale from '../components/scale'
import TopAxis from '../components/axis/top-axis'


// TODO Support incomplete months.
// TODO Support multiple years.
export default (name, parent = 'body') => {
  // Compose components.
  let scales = {
    x: Scale('linear'),
    y: Scale('band')
  }
  let { self, api } = compose(
    Chart('pie-chart', name, parent),
    ElementTooltip,
    // TODO Highlight(['.plot-group']),
    Label,
    LeftAxis(scales.y),
    TopAxis(scales.x)
  )

  // Private members.
  let _ = {
    // Variables
    scales,
    current: undefined,

    // Style variables.
    blocks: {
      names: ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'],
      margin: 0,
      numPerRow: 12
    },
    tiles: {
      names: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    },

    // Font metrics to position labels.
    fm: self._widget.getFontMetrics(),

    // Calculations.
    tileX (d, firstDay) {
      let i = Math.ceil((d.date - firstDay) / (1000 * 3600 * 24))
      return Math.floor((i + firstDay.getDay()) / 7)
    },

    labelFill: d => brightnessAdjustedColor(self._color.mapper(d)),

    // Update method.
    update (duration) {
      // Calculate some metrics for positioning the calendar:
      // - Start week day.
      // - Number of full weeks.
      const firstDay = self._chart.data[0].tiles[0].date
      // TODO Calculate this per row.
      const numMonths = self._chart.data.length
      const numDays = sum(self._chart.data, d => d.tiles.length)
      const numWeeks = Math.ceil((numDays - (7 - firstDay.getDay())) / 7) + 1

      // Determine tile size: it is the lowest from the calculated sizes based on the width and height
      // of the widget.
      const lx = parseFloat(self._widget.size.innerWidth) / (numWeeks + _.blocks.margin * (numMonths - 1))
      const ly = parseFloat(self._widget.size.innerHeight) / 7
      const size = Math.min(lx, ly)

      // Update color mapper scale.
      self._color.scale(scaleLinear()
        .domain(extent(self._chart.data.map(d => d.tiles).flat(), d => d.value))
        .range([0, 1])
      )

      // Some constants.
      const marginLeft = (parseFloat(self._widget.size.innerWidth) - size * (numWeeks + _.blocks.margin * (numMonths - 1))) / 2
      const marginTop = (parseFloat(self._widget.size.innerHeight) - size * 7) / 2
      const labelFontSize = Math.min(0.6 * size, parseFloat(self._font.size)) + 'px'
      const labelDy = (size + _.fm.capHeight * parseFloat(labelFontSize)) / 2

      // Scales.
      // TODO Per row.
      console.log(self._chart.data.map(d => d.metrics.offset))
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain([0, numWeeks + _.blocks.margin * (numMonths - 1)])
      _.scales.y.range(marginTop, parseInt(self._widget.size.innerHeight) - marginTop)
        .domain(_.tiles.names)
      // TODO Hide axis api...
      api.topAxis.values(self._chart.data.map(d => d.metrics.offset + _.blocks.margin * d.metrics.index))
        .topAxis.format((d, i) => _.blocks.names[i])

      // Axes: always remove axis lines.
      self._leftAxis.hideAxisLine(true)
      self._leftAxis.hideTicks(true)
      self._topAxis.hideAxisLine(true)
      self._topAxis.hideTicks(true)

      // Add blocks: each block is a plot group.
      // Implementation is similar to the scatter plot.
      self._chart.plotGroups({
        enter: g => {
          g.style('opacity', 0)
            // Transformations:
            // - Calendar margin to center it in container.
            // - Translate by the block margin.
            .attr('transform', d => `translate(${marginLeft + _.blocks.margin * d.metrics.index  * size}, ${marginTop})`)

          // Add tiles.
          const tiles = g.selectAll('.tile')
            .data(d => d.tiles)
            .enter().append('g')
            .attr('class', 'tile')
            .attr('transform', d => `translate(${_.tileX(d, firstDay) * size}, ${d.date.getDay() * size})`)
            .on('mouseover.calendar', d => {
              _.current = d
            })
            .on('mouseleave.calendar', () => {
              _.current = undefined
            })

          // Add rectangles.
          tiles.append('rect')
            .attr('x', 1)
            .attr('y', 1)
            .attr('width', size - 2)
            .attr('height', size - 2)
            .attr('rx', 0.1 * size)
            .attr('ry', 0.1 * size)
            .attr('stroke', 'transparent')
            .attr('stroke-width', 4)
            .attr('fill', self._color.mapper)

          // Add labels.
          tiles.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .attr('dx', 0.5 * size)
            .attr('dy', labelDy)
            .attr('text-anchor', 'middle')
            .attr('font-size', labelFontSize)
            .attr('fill', _.labelFill)
            .style('display', self._label.show ? null : 'none')
            .style('user-select', 'none')
            .text(self._label.format)

          return g
        },
        updateBefore: g => {
          // Update tiles.
          const tiles = g.selectAll('.tile')
            .data(d => d.tiles)
            // TODO Add days here when incomplete months are supported.
            /*.join(enter => enter,
              update => update,
              exit => exit.transition().duration(duration)
                .style('opacity', 0)
                .remove()
            )*/
            .transition().duration(duration)
            .attr('transform', d => `translate(${_.tileX(d, firstDay) * size}, ${d.date.getDay() * size})`)

          // Update rectangles
          tiles.select('rect')
            .attr('width', size - 2)
            .attr('height', size - 2)
            .attr('rx', 0.1 * size)
            .attr('ry', 0.1 * size)
            .attr('fill', self._color.mapper)

          // Update labels.
          tiles.select('text')
            .attr('dx', 0.5 * size)
            .attr('dy', labelDy)
            .attr('font-size', labelFontSize)
            .attr('fill', _.labelFill)
            .style('display', self._label.show ? null : 'none')
            .text(self._label.format)

          return g
        },
        update: g => g.style('opacity', 1)
            .attr('transform', d => `translate(${marginLeft + _.blocks.margin * d.metrics.index * size}, ${marginTop})`),
        exit: g => g.style('opacity', 0)
      }, duration)
    }
  }

  // Overrides
  self._chart.transformData = data => {
    // Parse dates.
    const dateParse = timeParse('%Y-%m-%d')
    const convertedData = data.map(d => ({
      date: dateParse(d.date),
      value: d.value
    }))

    // Determine first and last date.
    const firstMonth = min(convertedData.map(d => d.date)).getMonth()
    const lastMonth = max(convertedData.map(d => d.date)).getMonth()
    const year = convertedData[0].date.getFullYear()

    // Create month blocks.
    let offset = 0
    const blocks = Array.from({ length: lastMonth - firstMonth + 1 }, (d, index) => {
      // Do some counting.
      const month = (firstMonth + index) % 12
      const length = new Date(year, month + 1, 0).getDate()
      const start = new Date(year, month, 1)

      // Number of weeks.
      const firstWeekLength = (7 - start.getDay()) % 7
      const numWeeks = Math.ceil((length - firstWeekLength) / 7) + (firstWeekLength > 0 ? 1 : 0)

      // Add dates.
      const block = {
        metrics: {
          index,
          month,
          numWeeks,
          offset: Math.floor(offset / 7)
        },
        name: `month-${month}`,
        tiles: Array.from({ length }, (dd, j) => {
          const date = new Date(start)
          date.setDate(start.getDate() + j)
          return {
            name: `month-${month}`,
            date,
            // Initialize tiles with no data.
            value: null
          }
        })
      }

      // Update offset.
      offset += length

      return block
    })

    // Assign values from data.
    convertedData.forEach(d => {
      const name = `month-${d.date.getMonth()}`
      blocks.find(block => block.name === name)
        .tiles.find(tile => tile.date.getDate() === d.date.getDate()).value = +d.value
    })

    return blocks
  }

  // TODO self._highlight.container = self._chart.plots

  self._tooltip.content = () => {
    // If no wedge is hovered, hide tooltip
    if (typeof _.current === 'undefined') {
      return
    }

    return {
      title: _.current.date,
      stripe: self._color.mapper(_.current),
      content: {
        type: 'plots',
        data: [{
          name: 'value',
          value: _.current.value
        }]
      }
    }
  }

  self._widget.update = extend(self._widget.update, _.update, true)

  api = Object.assign(api || {}, {
    // TODO Docs.
    blockMargin (margin) {
      _.blocks.margin = margin || 0
      return api
    },

    days (names) {
      _.tiles.names = names || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      return api
    }

    // TODO API: add support for multiple rows of blocks.
    // TODO API: starting week day, default Sunday.
    // TODO API: monthly/yearly totals on side.
    // TODO API: specify month names.
    // TODO API: add non-full month support.
    // TODO API: month label start or center.
  })

  // Hide axis APIs as we don't want the user to modify them...
  // TODO Remove topAxis API.
  delete api.leftAxis

  self._color.init('sequential', d => d.value)

  return api
}
