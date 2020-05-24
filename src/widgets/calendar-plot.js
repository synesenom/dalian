import { min, max, sum, timeParse } from 'd3'
import compose from '../core/compose'
import extend from '../core/extend'
import brightnessAdjustedColor from '../utils/brightness-adjusted-color'
import { measureText } from '../utils/measure-text'
import { attrTween } from '../utils/tweens'
import Chart from '../components/chart'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'
import Label from '../components/label'


// TODO Support incomplete months.
// TODO Support multiple years.
export default (name, parent = 'body') => {
  // Compose components.
  let { self, api } = compose(
    Chart('pie-chart', name, parent),
    // TODO ElementTooltip,
    // TODO Highlight(['.plot-group']),
    // TODO Label ?
  )
  // TODO Set Color policy to sequential by default.

  // Private members.
  let _ = {
    // Style variables.
    blocks: {
      names: ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'],
      margin: 0,
      numPerRow: 12
    },

    // Update method.
    update (duration) {
      // Calculate some metrics for positioning the calendar:
      // - Start week day.
      // - Number of full weeks.
      const firstDay = self._chart.data[0].tiles[0].date
      // TODO Calculate this per row.
      const numDays = sum(self._chart.data, d => d.tiles.length)
      const numWeeks = Math.ceil((numDays - (7 - firstDay.getDay())) / 7) + 1

      // Determine tile size.
      // TODO Add block margin.
      const lx = parseFloat(self._widget.size.innerWidth) / numWeeks
      const ly = parseFloat(self._widget.size.innerHeight) / 7
      const size = Math.min(lx, ly)

      // Add blocks: each block is a plot group.
      // It is implemented very similar to the scatter plot.
      // TODO Set color policy to sequential.
      self._chart.plotGroups({
        enter: g => {
          g.style('opacity', 0)
            // TODO Remove this, use tile-level coloring.
            .style('color', self._color.mapper)
            .attr('stroke', '#fff')
            .attr('stroke-width', '2px')
            .attr('fill', 'currentColor')

          // Add tiles.
          g.selectAll('rect')
            .data(d => d.tiles)
            .enter().append('rect')
            .attr('class', 'tile')
            // TODO Make this a convenience method.
            .attr('x', d => {
              let i = Math.ceil((d.date - firstDay) / (1000 * 3600 * 24))
              return size * Math.floor((i + firstDay.getDay()) / 7)
            })
            .attr('y', d => size * d.date.getDay())
            .attr('width', size)
            .attr('height', size)
            .attr('rx', '4px')
            .attr('ry', '4px')

          return g
        },
        updateBefore: g => {
          // TODO Remove this, use tile-level coloring.
          g.style('color', self._color.mapper)

          g.selectAll('rect')
            .data(d => d.tiles)
            .join(
              enter => enter.append('rect')
                .attr('class', 'tile')
                .attr('x', d => {
                  let i = Math.ceil((d.date - firstDay) / (1000 * 3600 * 24))
                  return size * Math.floor((i + firstDay.getDay()) / 7)
                })
                .attr('y', d => size * d.date.getDay())
                .attr('width', size)
                .attr('height', size)
                .attr('rx', '4px')
                .attr('ry', '4px'),
              update => update,
              exit => exit.transition().duration(duration)
                .style('opacity', 0)
                .remove()
            )
            .transition().duration(duration)
            .attr('x', d => {
              let i = Math.ceil((d.date - firstDay) / (1000 * 3600 * 24))
              return size * Math.floor((i + firstDay.getDay()) / 7)
            })
            .attr('y', d => size * d.date.getDay())
            .attr('width', size)
            .attr('height', size)

          return g
        },
        update: g => g.style('opacity', 1),
        exit: g => g.style('opacity', 0)
      }, duration)


      // TODO Fit calendar in width and height.
      // TODO Calculate tile size based on width, height and block separation and blocks per row.
      // TODO Center calendar horizontally, top vertically.
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
    const blocks = Array.from({ length: lastMonth - firstMonth + 1 }, (d, i) => {
      // Determine number of days in month.
      const month = firstMonth + i
      const length = new Date(year, month + 1, 0).getDate()
      const start = new Date(year, month, 1)

      // Add dates.
      return {
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
    })

    // Assign values from data.
    convertedData.forEach(d => {
      const name = `month-${d.date.getMonth()}`
      blocks.find(block => block.name === name)
        .tiles.find(tile => tile.date.getDate() === d.date.getDate()).value = d.value
    })

    // Convert block names.


    return blocks
  }

  // TODO self._highlight.container = self._chart.plots

  // TODO self._tooltip.content = () => {}
  self._widget.update = extend(self._widget.update, _.update)

  api = Object.assign(api || {}, {
    // TODO API: add support for multiple rows of blocks.
    // TODO API: starting week day, default Sunday.
    // TODO API: month separation.
    // TODO API: monthly/yearly totals on side.
    // TODO API: specify week day names.
    // TODO API: specify month names.
    // TODO API: add non-full month support.
  })

  // TODO Set color policy to sequential.
  // TODO Set color map to d => d.value

  return api
}
