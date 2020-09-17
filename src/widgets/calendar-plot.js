import { extent, min, max, sum, scaleLinear } from 'd3'
import compose from '../core/compose'
import extend from '../core/extend'
import * as utc from '../utils/utc'
import { unrotate } from '../utils/array'
import {backgroundAdjustedColor} from '../utils/color-utils'
import Chart from '../components/chart'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'
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
 *   its value. The title is the date in ISO 8601 format.</li>
 *   <li>
 *     <a href="../components/highlight.html">Highlight</a> As each month block represents a plot group, they can be
 *     highlighted by passing month-<month index> to the highlight method, where <month index> is the 0-indexed month.
 *   </li>
 *   <li>
 *     <a href="../components/label.html">Label</a> Labels are shown inside the tiles. If the font size is too large,
 *     the labels are resized to fit in the tiles.
 *   </li>
 * </ul>
 *
 * @function CalendarPlot
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
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
      names: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      weekStart: 0
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
    Highlight(() => self._chart.plots, ['.plot-group']),
    Label,
    LeftAxis(scales.y),
    TopAxis(scales.x)
  )

  // Private members.
  const _ = {
    // Variables
    scales,
    current: undefined,
    metrics: {},

    // Style variables.
    blocks: {
      names: DEFAULTS.blocks.names,
      margin: DEFAULTS.blocks.margin,
      align: DEFAULTS.blocks.align
    },
    tiles: {
      names: DEFAULTS.tiles.names,
      weekStart: 0,
    },

    // Font metrics to position labels.
    fm: self._widget.getFontMetrics(),

    // Calculations.
    shiftDay: (day, shift) => ((day - shift + 7) % 7),

    tileX (d) {
      const i = Math.ceil((d.date - _.metrics.firstDay) / (1000 * 3600 * 24))
      return Math.floor((i + _.shiftDay(_.metrics.firstDay.getDay(), _.tiles.weekStart)) / 7)
    },

    labelFill: d => backgroundAdjustedColor(self._color.mapper(d)),

    addTiles (enter, size, labelDy, labelFontSize) {
      const tiles = enter.append('g')
        .attr('class', d => `tile date-${d.date.getDate()}`)
        // Y translation is shifted by the specified week start.
        .attr('transform', d => `translate(${_.tileX(d) * size}, ${_.shiftDay(d.date.getDay(), _.tiles.weekStart) * size})`)
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
        .attr('stroke-width', 2)
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

    // Update method.
    update (duration) {
      // TODO Move these to a method.
      const firstWeekLength = 7 - _.shiftDay(_.metrics.firstDay.getDay(), _.tiles.weekStart)
      const numWeeks = Math.ceil((_.metrics.numDays - firstWeekLength) / 7) + 1

      // Adjust block positions.
      self._chart.data.forEach(block => {
        block.x = Math.floor((block.daysOffset - firstWeekLength) / 7) + 1
        block.length = Math.ceil((block.daysOffset + block.numDays - firstWeekLength) / 7) + 1 - block.x
      })

      // Calculate some metrics for positioning the calendar:
      // - Start week day.
      // - Number of full weeks.
      // Determine tile size: it is the lowest from the calculated sizes based on the width and height
      // of the widget.
      const lx = parseFloat(self._widget.size.innerWidth) / (numWeeks + _.blocks.margin * (_.metrics.numMonths - 1))
      const ly = parseFloat(self._widget.size.innerHeight) / 7
      const size = Math.min(lx, ly)

      // Update color mapper scale.
      self._color.scale(scaleLinear()
        .domain(extent(self._chart.data.map(d => d.tiles).flat(), d => d.value))
        .range([0, 1])
      )

      // Some constants.
      const marginLeft = (parseFloat(self._widget.size.innerWidth) - size * (numWeeks + _.blocks.margin * (_.metrics.numMonths - 1))) / 2
      const marginTop = (parseFloat(self._widget.size.innerHeight) - size * 7) / 2
      const labelFontSize = Math.min(0.6 * size, parseFloat(self._font.size)) + 'px'
      const labelDy = (size + _.fm.capHeight * parseFloat(labelFontSize)) / 2

      // Scales.
      _.scales.x.range(marginLeft, parseInt(self._widget.size.innerWidth) - marginLeft)
        .domain([0, numWeeks + _.blocks.margin * (_.metrics.numMonths - 1)])
      _.scales.y.range(marginTop, parseInt(self._widget.size.innerHeight) - marginTop)
        // Labels are rotated backwards by the specified week start.
        .domain(unrotate(_.tiles.names, _.tiles.weekStart))

      // Adjust axes.
      self._leftAxis.hideAxisLine(true)
        .hideTicks(true)
        .margin({ left: marginLeft })
      self._topAxis.tickAnchor(_.blocks.align)
        .hideAxisLine(true)
        .hideTicks(true)
        .margin({ top: marginTop })
        .values(self._chart.data
          .map(d => d.x + (_.blocks.align === 'middle' ? 0.5 * d.length : 0) + _.blocks.margin * d.index))
        .format((d, i) => _.blocks.names[self._chart.data[i].month])

      // Add blocks: each block is a plot group.
      // Implementation is similar to the scatter plot.
      self._chart.plotGroups({
        enter: g => {
          g.style('opacity', 0)
            // Add year class to block.
            .classed(`year-${_.metrics.firstDay.getFullYear()}`, true)

            // Transformations:
            // - Calendar margin to center it in container.
            // - Translate by the block margin.
            .attr('transform', d => `translate(${marginLeft + _.blocks.margin * d.index * size}, ${marginTop})`)

          // Add tiles.
          _.addTiles(g.selectAll('.tile').data(d => d.tiles).enter(), size, labelDy, labelFontSize)

          return g
        },
        updateBefore: g => {
          // Update tiles.
          const tiles = g.selectAll('.tile')
            .data(d => d.tiles)
            .join(
              enter => {
                return _.addTiles(enter, size, labelDy, labelFontSize)
                  .style('opacity', 0)
              },
              update => update,
              exit => exit.transition().duration(duration)
                .style('opacity', 0)
                .remove()
            )
            .transition().duration(duration)
            .attr('transform', d => `translate(${_.tileX(d) * size}, ${_.shiftDay(d.date.getDay(), _.tiles.weekStart) * size})`)
            .style('opacity', 1)

          // Update rectangles.
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
          .attr('transform', d => `translate(${marginLeft + _.blocks.margin * d.index * size}, ${marginTop})`),
        exit: g => g.style('opacity', 0)
      }, duration)
    }
  }

  // Overrides
  self._chart.transformData = data => {
    // TODO Pre-compute everything and put in chart data.

    // Parse dates.
    const convertedData = data.map(d => ({
      date: utc.utcFromISO(d.date),
      value: +d.value
    }))

    // Determine first and last date.
    const firstMonth = min(convertedData.map(d => d.date)).getMonth()
    const lastMonth = max(convertedData.map(d => d.date)).getMonth()
    const year = convertedData[0].date.getFullYear()

    // Create month blocks.
    let daysOffset = 0
    const blocks = Array.from({length: lastMonth - firstMonth + 1}, (d, index) => {
      // Do some counting.
      const month = (firstMonth + index) % 12
      const numDays = utc.utcFromYMD(year, month + 1, 0).getDate()
      const firstDay = utc.utcFromYMD(year, month, 1)

      // Add dates.
      const block = {
        // Some constants.
        month,
        numDays,
        daysOffset,
        index,

        // Name and tiles.
        name: `month-${month}`,
        tiles: Array.from({length: numDays}, (tile, i) => {
          const date = new Date(firstDay)
          date.setDate(firstDay.getDate() + i)
          return {
            name: `month-${month}`,
            date,
            // Initialize tiles with no data.
            value: null
          }
        })
      }

      // Update offset.
      daysOffset += numDays

      return block
    })

    // Assign values from data.
    convertedData.forEach(d => {
      const name = `month-${d.date.getMonth()}`
      blocks.find(block => block.name === name)
        .tiles.find(tile => tile.date.getDate() === d.date.getDate()).value = d.value
    })

    // Compute some global metrics.
    _.metrics = {
      year: blocks[0].tiles[0].date.getFullYear(),
      firstDay: blocks[0].tiles[0].date,
      numDays: sum(blocks, d => d.tiles.length),
      numMonths: blocks.length
    }

    return blocks
  }

  // Overrides.
  self._tooltip.content = () => typeof _.current === 'undefined' ? undefined : {
    title: _.current.date.toISOString().substr(0, 10),
    stripe: self._color.mapper(_.current),
    content: {
      type: 'plots',
      data: [{
        name: 'value',
        value: _.current.value
      }]
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
     * @example
     *
     * // Set months to Spanish month names.
     * const calendar = dalian.CalendarPlot('my-chart')
     *   .months(['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
     *   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'])
     *   .render()
     *
     * // Reset month names to default.
     * calendar.months()
     *   .render()
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
     * @example
     *
     * // Set label alignment to center.
     * const calendar = dalian.CalendarPlot('my-chart')
     *   .blockAlign('middle')
     *   .render()
     *
     * // Reset alignment to default.
     * calendar.blockAlign()
     *   .render()
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
     * @example
     *
     * // Set block separation to twice the tile size.
     * const calendar = dalian.CalendarPlot('my-calendar')
     *   .blockMargin(2)
     *   .render()
     *
     * // Reset block separation to default.
     * calendar.blockMargin()
     *   .render()
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
     * @param {string[]} names Array representing the names of the days, starting with Sunday. Default values are the
     * short names in English.
     * @returns {CalendarPlot} Reference to the CalendarPlot API.
     * @example
     *
     * // Set day names to Spanish short names.
     * const calendar = dalian.CalendarPlot('my-chart')
     *   .days(['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sa'])
     *   .render()
     *
     * // Reset day names to default.
     * calendar.days()
     *   .render()
     */
    days (names = DEFAULTS.tiles.names) {
      _.tiles.names = names
      return api
    },

    /**
     * Sets the start of the week (topmost weekday).
     *
     * @method weekStart
     * @methodOf CalendarPlot
     * @param {number} day Week start as an index. Supported values go from 0 (Sunday) to 6 (Saturday).
     * @returns {CalendarPlot} Reference to the CalendarPlot API.
     * @example
     *
     * // Set start of the week to Monday.
     * const calendar = dalian.CalendarPlot('my-chart')
     *   .weekStart(1)
     *   .render()
     *
     * // Reset week start to default.
     * calendar.weekStart()
     *   .render()
     */
    weekStart (day = DEFAULTS.tiles.weekStart) {
      _.tiles.weekStart = day
      return api
    }

    // TODO API: add support for multiple rows of blocks.
    // TODO API: monthly/yearly totals on side.
    // TODO API: add incomplete month support.
    /**
     * Set/updates the data that is shown in the calendar plot. In the bar chart, months are the plot groups, therefore
     * so methods that operate on plot groups are applied on the month blocks.
     *
     * @method data
     * @methodOf CalendarPlot
     * @param {Object[]} plots Array of objects representing the date values. Each data point has two properties:
     * <dl>
     *   <dt>date</dt>  <dd>{string} Date of the data point in ISO 8601 YYYY-MM-DD date format.</dd>
     *   <dt>value</dt> <dd>{number} Value of the data point.</dd>
     * </dl>
     * The data does not have to include all dates within the period of interest: missing dates will be represented by
     * data points with {value = null}.
     * @returns {CalendarPlot} Reference to the CalendarPlot API.
     * @example
     *
     * const calendar = dalian.CalendarPlot('my-chart')
     *   .data([
     *     {date: '2020-01-03', value: 32},
     *     {name: '2020-01-04', value: 12},
     *     {name: '2020-01-16', value: 10},
     *     ...
     *   ])
     *   .render()
     */
  })

  // Hide axis APIs as we don't want the user to modify them...
  delete api.leftAxis
  delete api.topAxis

  // Set color policy and mapper.
  self._color.init('sequential', d => d.value)

  return api
}
