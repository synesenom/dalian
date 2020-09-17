import extend from '../core/extend'
import compose from '../core/compose'
import Font from '../components/font'
import Description from '../components/description'
import Highlight from '../components/highlight'
import Mouse from '../components/mouse'
import Placeholder from '../components/placeholder'
import Widget from '../components/widget'
import StyleInjector from '../utils/style-injector'
import {utcFromISO} from '../utils/utc'
import { backgroundAdjustedColor, lighter } from '../utils/color-utils'

// Default values.
const DEFAULTS = {
  color: '#888',
  pageSize: 0
}

// Selectors.
const TAG = 'dalian-table-'
const SELECTORS = {
  container: TAG + 'container',
  table: TAG + 'table',
  head: TAG + 'head',
  headContainer: TAG + 'head-container',
  headLabel: TAG + 'ead-label',
  headSvg: TAG + 'head-svg',
  headMarker: TAG + 'head-marker',
  scrollbarTrack: TAG + 'container::-webkit-scrollbar-track',
  scrollbarThumb: id => id + ' .dalian-table-container::-webkit-scrollbar-thumb',
  scrollbarThumbHover: id => id + ' .dalian-table-container::-webkit-scrollbar-thumb:hover',
  paging: TAG + 'paging',
  pagingBlock: TAG + 'paging-block',
  pagingNumber: TAG + 'paging-number',
  pagingTotalBefore: TAG + 'paging-total:before',
  pagingButton: TAG + 'paging-button',
  pagingButtonHover: TAG + 'paging-button:hover'
}

/**
 * The table widget. This widget extends the following components:
 * <ul>
 *   <li><a href="./components/bottom-axis.html">BottomAxis</a></li>
 *   <li><a href="./components/description.html">Description</a></li>
 *   <li><a href="./components/font.html">Font</a></li>
 *   <li><a href="./components/highlight.html">Highlight</a>: Table rows, columns, cells and any combination of these
 *   can be highlighted by passing {'row-&lt;row number&gt;'}, {'column-&lt;column ID&gt;'} or
 *   {'cell-&lt;row number&gt;-&lt;column ID&gt;'} to the {highlight} method. The default highlight style uses the
 *   header color as background for the highlighted cells.</li>
 *   <li><a href="./components/mouse.html">Mouse</a>: When interacting with a table cell, an object with three keys are
 *   passed to the mouse callback: {row}, {column} and {value} representing the row number, column ID and value of the
 *   table cell. These values can be used to highlight rows, columns or cells in the table.</li>
 *   <li><a href="./components/placeholder.html">Placeholder</a></li>
 *   <li><a href="./components/widget.html">Widget</a></li>
 * </ul>
 *
 * @function Table
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
export default (name, parent = 'body') => {
  // Inject fixed styles.
  StyleInjector.addClass(SELECTORS.container, {
    position: 'relative',
    overflow: 'auto',
    'pointer-events': 'all',
  }).addClass(SELECTORS.scrollbarTrack, {
    background: 'transparent'
  }).addClass(SELECTORS.table, {
    width: '100%',
    'border-collapse': 'collapse',
    'user-select': 'none'
  }).addClass(SELECTORS.head, {
    position: 'sticky',
    top: 0,
    padding: '5px 10px',
    cursor: 'pointer',
    'white-space': 'nowrap',
    'font-weight': 'normal',
    'font-variant': 'all-small-caps'
  }).addClass(SELECTORS.headContainer, {
    position: 'relative',
    display: 'inline-block'
  }).addClass(SELECTORS.headLabel, {
    'margin-right': '12px'
  }).addClass(SELECTORS.headSvg, {
    position: 'absolute',
    right: 0,
    top: 'calc(50% - 4px)'
  }).addClass(SELECTORS.paging, {
    position: 'relative',
    float: 'right',
    width: '100px',
    height: '25px',
    'pointer-events': 'all',
    'user-select': 'none'
  }).addClass(SELECTORS.pagingBlock, {
    position: 'relative',
    float: 'left',
    width: '25px',
    height: '25px'
  }).addClass(SELECTORS.pagingNumber, {
    'text-align': 'center',
    'line-height': '25px'
  }).addClass(SELECTORS.pagingTotalBefore, {
    content: '"/"',
    position: 'absolute',
    left: '-2px'
  }).addClass(SELECTORS.pagingButton, {
    cursor: 'pointer',
    opacity: 0.2
  }).addClass(SELECTORS.pagingButtonHover, {
    opacity: 1
  })

  // Build widget from components.
  let { self, api } = compose(
    Widget('table', name, parent, 'div'),
    Description,
    Highlight(() => _.dom.table, ['td'], (() => {
      const background = lighter(DEFAULTS.color, 0.8)
      return {
        focus: {
          color: backgroundAdjustedColor(background),
          background
        }
      }
    })()),
    Mouse,
    Font,
    Placeholder
  )

  // Add scrollbar styles.
  StyleInjector.addId(SELECTORS.scrollbarThumb(self._widget.id), {
    background: lighter(DEFAULTS.color, 0.8)
  }).addId(SELECTORS.scrollbarThumbHover(self._widget.id), {
    background: DEFAULTS.color
  })

  const _ = {
    // Font metrics for proper positioning of the head marker.
    fm: self._widget.getFontMetrics(),

    // UI.
    colors: {
      main: DEFAULTS.color,
      light: lighter(DEFAULTS.color, 0.8)
    },

    // Data.
    data: {
      cols: [],
      schema: [],
      values: []
    },

    // DOM.
    dom: (() => {
      // Set up container and style scrollbar.
      const container = self._widget.content.append('div')
        .attr('class', SELECTORS.container)
      const table = container.append('table')
        .attr('class', SELECTORS.table)

      return {
        container,
        table,
        header: table.append('thead')
          .append('tr'),
        body: table.append('tbody')
      }
    })(),

    sorting: {
      key: null,
      ascending: true,

      arrow (type) {
        if (typeof type === 'undefined') {
          return ''
        }

        return type === 'up' ? 'm 1 8 l 4 -6.92 l 4 6.92 z'
          : 'm 1 2 l 4 6.92 l 4 -6.92 z'
      },

      update (key, ascending) {
        _.sorting.key = key
        _.sorting.ascending = ascending
      },

      sorter (key, type = 'string', reverse = false) {
        const factor = reverse ? -1 : 1
        switch (type) {
          default:
          case 'string':
            return (a, b) => factor * a[key].localeCompare(b[key])
          case 'number':
            return (a, b) => factor * (a[key] - b[key])
          case 'date':
            return (a, b) => factor * (utcFromISO(a[key]) - utcFromISO(b[key]))
        }
      },

      sort (column) {
        switch (_.sorting.key) {
          default:
          case null:
            // No sorting column: sort by this in ascending order.
            _.data.values.sort(_.sorting.sorter(column.key, column.type))
            _.sorting.update(column.key, true)
            break
          case column.key:
            if (_.sorting.ascending) {
              // Sorted by current column in ascending order: sort in descending order.
              _.data.values.sort(_.sorting.sorter(column.key, column.type, true))
              _.sorting.update(column.key, false)
            } else {
              // Sorted by current column in descending order: remove sort.
              _.data.values.sort((a, b) => a._id - b._id)
              _.sorting.update(null, true)
            }
        }
        _.updateBody()
        _.dom.header.selectAll('.' + SELECTORS.headMarker)
          .attr('d',
              h => _.sorting.arrow(h.key === _.sorting.key ? _.sorting.ascending ? 'up' : 'down': undefined))
      }
    },

    paging: (() => {
      let size = DEFAULTS.pageSize
      let page = 0

      const dom = (() => {
        const g = self._widget.content.append('div')
          .attr('class', SELECTORS.paging)
        const left = g.append('div')
          .attr('class', `${SELECTORS.pagingBlock} ${SELECTORS.pagingButton}`)
          .on('click', () => {
            if (size > 0 && page > 0) {
              page--
              _.updateBody()
              dom.current.text(page + 1)
            }
          })
        left.append('svg')
          .attr('viewBox', '0 0 16 16')
          .style('width', '100%')
          .style('width', '100%')
          .append('path')
          .attr('d', 'm 10 4 l -6.92 4 l 6.92 4 z')
        const current = g.append('div')
          .attr('class', `${SELECTORS.pagingBlock} ${SELECTORS.pagingNumber}`)
        const total = g.append('div')
          .attr('class', `${SELECTORS.pagingBlock} ${SELECTORS.pagingNumber} ${TAG}paging-total`)
        const right = g.append('div')
          .attr('class', `${SELECTORS.pagingBlock} ${SELECTORS.pagingButton}`)
          .on('click', () => {
            if (size > 0 && page < Math.ceil(_.data.values.length / size) - 1) {
              page++
              _.updateBody()
              dom.current.text(page + 1)
            }
          })
        right.append('svg')
          .attr('viewBox', '0 0 16 16')
          .style('width', '100%')
          .style('width', '100%')
          .append('path')
          .attr('d', 'm 2 4 l 6.92 4 l -6.92 4 z')

        return {
          g,
          current,
          total
        }
      })()

      return {
        update(duration) {
          dom.g.style('display', size > 0 ? null : 'none')
          if (size > 0) {
            dom.g.transition().duration(duration)
              .style('margin-right', self._widget.margins.right + 'px')
            dom.current.text(page + 1)
            dom.total.text(Math.ceil(_.data.values.length / size))
          }
        },

        filter (data) {
          if (size > 0) {
            let idMin = page * size
            let idMax = idMin + size
            return data.filter((d, i) => i >= idMin && i < idMax)
          } else {
            return data
          }
        },

        reset (pageSize) {
          if (typeof pageSize !== 'undefined') {
            size = pageSize
          }
          page = 0
        },

        size: () => size
      }
    })(),

    align (d) {
      switch (d.type) {
        default:
        case 'string':
        case 'date':
          return 'left'
        case 'number':
          return 'right'
      }
    },

    updateBody () {
      // Determine effective schema.
      const schema = _.data.schema.filter(h => _.data.cols.indexOf(h.key) > -1)

      // Get page data.
      let data = _.paging.filter(_.data.values)

      // Update body.
      _.dom.body.selectAll('tr')
        // Dirty trick: we use current time and a random tag to prevent D3 selection updates.
        .data(data, () => Date.now() + '' + Math.random())
        .join(
          enter => {
            // Add row.
            const row = enter.append('tr')
              .style('height', '2em')
              .style('line-height', '2em')

            // Add columns.
            row.selectAll('td')
              .data(d => schema.map(h => ({
                row: d._id,
                column: h.key,
                value: d[h.key],
                type: h.type,
                displayValue: typeof h.format === 'undefined' ? d[h.key] : h.format(d[h.key])
              })))
              .enter().append('td')
              .attr('class', d => `row-${d.row} column-${d.column} cell-${d.row}-${d.column}`)
              .style('padding', '0.25em 0.5em')
              .style('white-space', 'nowrap')
              .style('text-align', _.align)
              .on('mouseover.table', self._mouse.over)
              .on('mouseleave.table', self._mouse.leave)
              .on('click.table', self._mouse.click)
              .text(d => d.displayValue)

            return row
          },
          update => update,
          exit => {
            // If we have too few rows (when paging), keep some rows and clear them.
            let buffer = _.paging.size() - data.length
            exit.filter((d, i) => i < buffer)
              // Move empty rows to the bottom of the table.
              .raise()
              // Remove all cells.
              .selectAll('td')
              .remove()

            // Remove the rest.
            exit.filter((d, i) => i >= buffer)
              .remove()
          }
        )
    },

    update (duration) {
      // Adjust container.
      _.dom.container.transition().duration(duration)
        .style('width', self._widget.size.innerWidth)
        .style('height', self._widget.size.innerHeight)
        .style('margin-left', self._widget.margins.left + 'px')
        .style('margin-top', self._widget.margins.top + 'px')
      _.dom.table
        .style('height', self._widget.size.innerHeight)

      // Calculate effective schema.
      const schema = _.data.schema.filter(h => _.data.cols.indexOf(h.key) > -1)

      // Update header.
      const tableHeader = _.dom.header.selectAll('th')
        .data(schema, d => d.key)
        .join(
          enter => {
            // Add row.
            const row = enter.append('th')
              .style('user-select', 'none')

            // Add head label and sorting arrow.
            const div = row.append('div')
              .attr('class', SELECTORS.headContainer)
              .style('float', _.align)
            div.append('span')
              .attr('class', SELECTORS.headLabel)
            div.append('svg')
              .attr('class', SELECTORS.headSvg)
              .attr('viewBox', '0 0 10 10')
              .style('width', `${_.fm.capHeight}em`)
              .style('height', `${_.fm.capHeight}em`)
              .append('path')
              .attr('class', SELECTORS.headMarker)
              .attr('fill', 'currentColor')
              .attr('d', _.sorting.arrow())

            return row
          },
          update => update,
          exit => exit.remove()
        )
        .on('click', _.sorting.sort)

      tableHeader
        .attr('class', SELECTORS.head)
        .style('background', _.colors.main)
        .style('color', backgroundAdjustedColor(_.colors.main))
        .select('.' + SELECTORS.headLabel)
        .html(h => h.name)

      // Update body.
      _.updateBody()

      // Update paging box.
      _.paging.update(duration)
    }
  }

  // Extend widget update
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API.
  api = Object.assign(api, {
    /**
     * Sets the table content. This method clears the table and re-populates it with the new data. Note that a schema
     * has to be defined for the data using the <a href='#schema'>schema</a> method.
     *
     * @method data
     * @methodOf Table
     * @param {Object[]} data Array of objects representing the rows of the table. Each row is an object with the column
     * IDs as property names and cell values as values.
     * @returns {Table} Reference to the Table API.
     * @example
     *
     * const table = dalian.Table('my-table')
     *   .data([
     *     {name: 'Alice',   id: 1, year: '1985-02-01'},
     *     {name: 'Bob',     id: 2, year: '1993-05-13'},
     *     {name: 'Charlie', id: 3, year: '1968-07-08'},
     *     ...
     *   ])
     *   .render()
     */
    data (data) {
      // Add index.
      _.data.values = data.map((d, i) => Object.assign(d, {_id: i}))

      // Reset paging.
      _.paging.reset()

      // Read available column IDs.
      _.data.cols = Object.keys(data[0] || {})

      // Reset sorting state.
      _.sorting.update(null, true)
      _.dom.header.selectAll('.table-head-sorting')
        .text('')
      return api
    },

    /**
     * Sets the table schema. The schema contains column names and types.
     *
     * @method schema
     * @methodOf Table
     * @param {Object[]} schema Array of objects representing the columns. Each column must have a {key} and
     * {name} properties. Also, the column can have the following optional properties:
     * <ul>
     *   <li>{type}: Type of the column, used for sorting. Supported values: string, number, date. Default value is
     *   string.</li>
     *   <li>{format}: Formatting function to use when displaying the column values. Default value is the string
     *   representation of the value.</li>
     * </ul>
     * @returns {Table} Reference to the Table API.
     * @example
     *
     * const table = dalian.Table('my-table')
     *   .schema([
     *     {key: 'name', name: 'Player name'},
     *     {key: 'id', name: 'Identifier', type: 'number'},
     *     {key: 'year', name: 'Year born', format: d => new Date(d).getFullYear()}
     *   ])
     *   .render()
     */
    schema (schema) {
      _.data.schema = schema
      return api
    },

    /**
     * Sets the table theme color.
     *
     * @method color
     * @methodOf Table
     * @param {string} [color = #888] Color to set.
     * @returns {Table} Reference to the Table API.
     * @example
     *
     * // Set color to royalblue.
     * const table = dalian.Table('my-table')
     *   .color('royalblue')
     *   .render()
     *
     * // Reset color to default.
     * table.color()
     *   .render()
     */
    color (color = DEFAULTS.color) {
      // Update color.
      _.colors = {
        main: color,
        light: lighter(color, 0.8)
      }

      // Update scrollbar style.
      StyleInjector.updateId(SELECTORS.scrollbarThumb(self._widget.id), {
        background: _.colors.light
      }).updateId(SELECTORS.scrollbarThumbHover(self._widget.id), {
        background: color
      })

      // Update highlight style.
      self._highlight.style({
        focus: {
          color: backgroundAdjustedColor(_.colors.light),
          background: _.colors.light
        }
      })

      return api
    },

    /**
     * Enables/disables paging functionality.
     *
     * @method paging
     * @methodOf Table
     * @param {number} size Number of rows in a single page.
     * @returns {Table} Reference to the Table API.
     * @example
     *
     * // Set paging with 5 rows per page.
     * const table = dalian.Table('my-table')
     *   .paging(5)
     *   .render()
     *
     * // Disable paging.
     * table.paging()
     *   .render()
     */
    paging (size = DEFAULTS.pageSize) {
      _.paging.reset(size)
      return api
    }

    // TODO Remove row
    // TODO Remove col
    // TODO Add paging.
  })

  return api
}
