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
  color: '#ddd',
  schema: []
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
  headMarker: TAG + 'head-marker'
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
 * @param {string} [parent = body] Query selector of the parent element to append widget to.
 */
export default (name, parent = 'body') => {
  // Inject fixed styles.
  StyleInjector.addClass(SELECTORS.container, {
    position: 'relative',
    overflow: 'auto',
    'pointer-events': 'all',
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
  })

  // Build widget from components.
  let { self, api } = compose(
    Widget('table', name, parent, 'div'),
    Description,
    Highlight(['td'], {
      focus: {
        color: backgroundAdjustedColor(lighter(DEFAULTS.color)),
        'background-color': lighter(DEFAULTS.color)
      }
    }),
    Mouse,
    Font,
    Placeholder
  )

  const _ = {
    fm: self._widget.getFontMetrics(),

    // UI.
    ui: {
      color: DEFAULTS.color
    },

    // Internal operations.
    state: {
      cols: [],
      sort: {
        key: null,
        ascending: true
      }
    },

    // Data.
    data: {
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
      const header = table.append('thead')
        .append('tr')
      const body = table.append('tbody')

      return {
        container,
        table,
        header,
        body
      }
    })(),

    arrow (type) {
      if (typeof type === 'undefined') {
        return ''
      }

      return type === 'up' ? 'm 1 8 l 4 -6.92 l 4 6.92 z'
        : 'm 1 2 l 4 6.92 l 4 -6.92 z'
    },

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

    sortByColumn (schema, column, data) {
      switch (_.state.sort.key) {
        default:
        case null:
          // No sorting column: sort by this in ascending order.
          _.updateBody(schema, data.sort(_.sorter(column.key, column.type)))
          _.dom.header.selectAll('.' + SELECTORS.headMarker)
            .attr('d', h => _.arrow(h.key === column.key ? 'up' : undefined))
          _.state.sort = {
            key: column.key,
            ascending: true
          }
          break
        case column.key:
          if (_.state.sort.ascending) {
            // Sorted by current column in ascending order: sort in descending order.
            _.updateBody(schema, data.sort(_.sorter(column.key, column.type, true)))
            _.dom.header.selectAll('.' + SELECTORS.headMarker)
              .attr('d', h => _.arrow(h.key === column.key ? 'down' : undefined))
            _.state.sort = {
              key: column.key,
              ascending: false
            }
          } else {
            // Sorted by current column in descending order: remove sort.
            _.updateBody(schema, data.sort((a, b) => a._id - b._id))
            _.dom.header.selectAll('.' + SELECTORS.headMarker)
              .attr('d', _.arrow())
            _.state.sort = {
              key: null,
              ascending: true
            }
          }
      }
    },

    updateBody (schema, data) {
      _.dom.body.selectAll('tr')
        // Dirty trick: we use current time and a random tag to prevent D3 selection updates.
        .data(data, () => Date.now() + '' + Math.random())
        .join(
          enter => {
            // Add row.
            const row = enter.append('tr')
              // TODO Pass rowId, colId and cell content to mouse callbacks.

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
              .style('padding', '5px 10px')
              .style('white-space', 'nowrap')
              .style('text-align', _.align)
              .on('mouseover.table', self._mouse.over)
              .on('mouseleave.table', self._mouse.leave)
              .on('click.table', self._mouse.click)
              .text(d => d.displayValue)

            return row
          },
          update => update,
          exit => exit.remove()
        )
    },

    update (duration) {
      // TODO Style scrollbar.

      // Adjust container.
      _.dom.container.transition().duration(duration)
        .style('width', self._widget.size.innerWidth)
        .style('height', self._widget.size.innerHeight)
        .style('margin-left', self._widget.margins.left + 'px')
        .style('margin-top', self._widget.margins.top + 'px')
      _.dom.table
        .style('height', self._widget.size.innerHeight)

      // Filter schema.
      const schema = _.data.schema.filter(h => _.state.cols.indexOf(h.key) > -1)

      // Update header.
      const fontSize = parseFloat(self._font.size)
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
              .style('width', _.fm.capHeight * fontSize + 'px')
              .style('height', _.fm.capHeight * fontSize + 'px')
              .append('path')
              .attr('class', SELECTORS.headMarker)
              .attr('stroke-width', '3px')
              .attr('d', _.arrow())

            return row
          },
          update => update,
          exit => exit.remove()
        )
        .on('click', d => _.sortByColumn(schema, d, _.data.values))

      tableHeader
        .attr('class', SELECTORS.head)
        .style('background-color', _.ui.color)
        .style('color', backgroundAdjustedColor(_.ui.color))
        .select('.' + SELECTORS.headLabel)
        .html(h => h.name)

      // Update body.
      _.updateBody(schema, _.data.values)
    }
  }

  // Overrides.
  self._highlight.container = _.dom.table

  // Extend widget update
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API.
  api = Object.assign(api, {
    /**
     * Sets the table content. This method clears the table and re-populates it with the new data.
     *
     * @method data
     * @methodOf Table
     * @param {Object[]} data Array of objects representing the rows of the table. Each row is an object with the column
     * IDs as property names and cell values as values.
     * @returns {Table} Reference to the Table API.
     */
    data (data) {
      _.data.values = data.map((d, i) => Object.assign(d, {_id: i}))

      // Read available column IDs.
      _.state.cols = Object.keys(data[0] || {})

      // Reset sorting state.
      _.state.sort = {
        key: null,
        ascending: true
      }
      _.dom.header.selectAll('.table-head-sorting')
        .text('')
      return api
    },

    /**
     * Sets the table schema. The schema contains column names and types.
     *
     * @method schema
     * @methodOf Table
     * @param {Object[]} [schema = Array()] Array of objects representing the columns. Each column must have a {key} and
     * {name} properties. Also, the column can have the following optional properties:
     * <ul>
     *   <li>{type}: Type of the column, used for sorting. Supported values: string, number, date. Default value is
     *   string.</li>
     *   <li>{format}: Formatting function to use when displaying the column values. Default value is the string
     *   representation of the value.</li>
     * </ul>
     * @returns {Table} Reference to the Table API.
     */
    // TODO Add editable option to schema.
    schema (schema = DEFAULTS.schema) {
      _.data.schema = schema
      return api
    },

    /**
     * Sets the table theme color.
     *
     * @method color
     * @methodOf Table
     * @param {string} color Color to set.
     * @returns {Table} Reference to the Table API.
     */
    color (color) {
      _.ui.color = color
      return api
    },

    // TODO Access element by (col, row)
    // TODO Update element by (col, row)
    cell (row, column, value) {
      if (typeof value === 'undefined') {
        return _.data.values[row][column]
      } else {
        _.data.values[row][column] = value
        return api
      }
    }

    // TODO Remove row
    // TODO Remove col
    // TODO Add paging.
  })

  return api
}
