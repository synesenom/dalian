import { extent, min, max, sum, scaleLinear, timeParse } from 'd3'
import compose from '../core/compose'
import extend from '../core/extend'
import brightnessAdjustedColor from '../utils/brightness-adjusted-color'
import Chart from '../components/chart'
import ElementTooltip from '../components/tooltip/element-tooltip'
// TODO import Highlight from '../components/highlight'
import Label from '../components/label'
import LeftAxis from '../components/axis/left-axis'
import Scale from '../components/scale'
import TopAxis from '../components/axis/top-axis'

// TODO Support incomplete months.
// TODO Support multiple years.
/**
 * The calendar plot widget. As a chart, it extends the [Chart]{@link ../components/chart.html} component, with all of
 * its available APIs. Furthermore, it extends the following components:
 * <ul>
 *   <li><a href="./components/element-tooltip.html">ElementTooltip</a> The tooltip displays the date of the tile and
 *   its value.</li>
 *   <li>
 *     <a href="../components/label.html">Label</a> Labels are shown inside the tiles. If the font size is too large,
 *     the labels are resized to fit in the tiles.
 *   </li>
 * </ul>
 *
 * @function CalendarPlot
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] Query selector of the parent element to append widget to.
 */
export default (name, parent = 'body') => {
  // Default values.
  const DEFAULTS = {
    blocks: {
      names: ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'],
      margin: 0,
      align: 'start'
    },
    tiles: {
      names: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    }
  }

  // Compose factory.
  const scales = {
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
  const _ = {
    // Variables
    scales,
    current: undefined,

    // Style variables.
    blocks: {
      names: DEFAULTS.blocks.names,
      margin: DEFAULTS.blocks.margin,
      align: DEFAULTS.blocks.align
    },
    tiles: {
      names: DEFAULTS.tiles.names
    },

    // Font metrics to position labels.
    fm: self._widget.getFontMetrics(),

    addTiles (enter, firstDay, size, labelDy, labelFontSize) {
      const tiles = enter.append('g')
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

      return tiles
    },

    // Calculations.
    tileX (d, firstDay) {
      const i = Math.ceil((d.date - firstDay) / (1000 * 3600 * 24))
      return Math.floor((i + firstDay.getDay()) / 7)
    },

    labelFill: d => brightnessAdjustedColor(self._color.mapper(d)),

    // Update method.
    update (duration) {
      // TODO Move the calculations in the data transform.
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
      _.scales.x.range(marginLeft, parseInt(self._widget.size.innerWidth) - marginLeft)
        .domain([0, numWeeks + _.blocks.margin * (numMonths - 1)])
      _.scales.y.range(marginTop, parseInt(self._widget.size.innerHeight) - marginTop)
        .domain(_.tiles.names)

      // Adjust axes.
      self._leftAxis.hideAxisLine(true)
        .hideTicks(true)
        .margin({ left: marginLeft })
      self._topAxis.tickAnchor(_.blocks.align)
        .hideAxisLine(true)
        .hideTicks(true)
        .margin({ top: marginTop })
        .values(self._chart.data
          .map(d => d.x + (_.blocks.align === 'middle' ? 0.5 * d.length : 0) + _.blocks.margin * d.column))
        .format((d, i) => _.blocks.names[self._chart.data[i].month])

      // Add blocks: each block is a plot group.
      // Implementation is similar to the scatter plot.
      self._chart.plotGroups({
        enter: g => {
          g.style('opacity', 0)
            // Transformations:
            // - Calendar margin to center it in container.
            // - Translate by the block margin.
            .attr('transform', d => `translate(${marginLeft + _.blocks.margin * d.column * size}, ${marginTop})`)

          // Add tiles.
          _.addTiles(g.selectAll('.tile').data(d => d.tiles).enter(), firstDay, size, labelDy, labelFontSize)

          return g
        },
        updateBefore: g => {
          // Update tiles.
          const tiles = g.selectAll('.tile')
            .data(d => d.tiles)
            .join(
              enter => {
                return _.addTiles(enter, firstDay, size, labelDy, labelFontSize)
                  .style('opacity', 0)
              },
              update => update,
              exit => exit.transition().duration(duration)
                .style('opacity', 0)
                .remove()
            )
            .transition().duration(duration)
            .attr('transform', d => `translate(${_.tileX(d, firstDay) * size}, ${d.date.getDay() * size})`)
            .style('opacity', 1)

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
          .attr('transform', d => `translate(${marginLeft + _.blocks.margin * d.column * size}, ${marginTop})`),
        exit: g => g.style('opacity', 0)
      }, duration)
    }
  }

  // Overrides
  self._chart.transformData = data => {
    // TODO Pre-compute everything and put in chart data.

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
    let totalDays = 0
    const dayOffset = (7 - new Date(year, firstMonth, 1).getDay()) % 7
    const blocks = Array.from({ length: lastMonth - firstMonth + 1 }, (d, index) => {
      // Do some counting.
      const month = (firstMonth + index) % 12
      const numDays = new Date(year, month + 1, 0).getDate()
      const start = new Date(year, month, 1)

      // Number of weeks.
      const firstWeek = (7 - start.getDay()) % 7
      const numWeeks = Math.ceil((numDays - firstWeek) / 7) + (firstWeek > 0 ? 1 : 0)

      // Add dates.
      const block = {
        month,
        column: index,
        length: numWeeks,
        x: Math.floor((totalDays - dayOffset) / 7) + (dayOffset > 0 ? 1 : 0),
        name: `month-${month}`,
        tiles: Array.from({ length: numDays }, (dd, j) => {
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
      totalDays += numDays

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
    /**
     * Sets the names of the months.
     *
     * @method months
     * @methodOf CalendarPlot
     * @param {string[]} names Array of strings representing the month names. Default values are the month names in
     * English.
     * @returns {CalendarPlot} Reference to the CalendarPlot API.
     */
    months (names = DEFAULTS.blocks.names) {
      _.blocks.names = names
      return api
    },

    /**
     * Sets the label alignment for the month blocks.
     *
     * @method blockAlign
     * @methodOf CalendarPlot
     * @param {string} [align = start] Alignment value to set. Supported values: start, middle.
     * @returns {CalendarPlot} Reference to the CalendarPlot API.
     */
    blockAlign (align = DEFAULTS.blocks.align) {
      _.blocks.align = align
      return api
    },

    /**
     * Sets the margin between the month blocks.
     *
     * @method blockMargin
     * @methodOf CalendarPlot
     * @param {number} [margin = 0] Size of the margin between month blocks relative to the tile size.
     * @returns {CalendarPlot} Reference to the CalendarPlot API.
     */
    blockMargin (margin = DEFAULTS.blocks.margin) {
      _.blocks.margin = margin
      return api
    },

    /**
     * Sets the names of the days.
     *
     * @method days
     * @methodOf CalendarPlot
     * @param {string[]} names Array representing the names of the days. Default values are the short names in English.
     * @returns {CalendarPlot} Reference to the CalendarPlot API.
     */
    days (names = DEFAULTS.tiles.names) {
      _.tiles.names = names
      return api
    }

    // TODO API: add support for multiple rows of blocks.
    // TODO API: starting week day, default Sunday.
    // TODO API: monthly/yearly totals on side.
    // TODO API: add incomplete month support.
  })

  // Hide axis APIs as we don't want the user to modify them...
  delete api.leftAxis
  delete api.topAxis

  // Set color policy and mapper.
  self._color.init('sequential', d => d.value)

  return api
}
