import compose from '../core/compose'
import extend from '../core/extend'
import Patterns from '../utils/patterns'
import Widget from '../components/widget'
import Font from '../components/font'
import Highlight from '../components/highlight'
import Mouse from '../components/mouse'
import Color from '../components/color'
import encode from '../core/encode'

/**
 * The legend widget. This widget extends the following components:
 * <ul>
 *   <li><a href="../components/color.html">Color</a></li>
 *   <li><a href="../components/font.html">Font</a></li>
 *   <li><a href="../components/highlight.html">Highlight</a>: plot groups can be highlighted by passing their names
 *   as specified in the data array.</li>
 *   <li><a href="../components/mouse.html">Mouse</a>: The group name and the wedge {y} value is passed to each mouse
 *   callback.</li>
 *   <li><a href="../components/widget.html">Widget</a></li>
 * </ul>
 *
 * @function Legend
 * @param {string} name Name of the legend. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
export default (name, parent = 'body') => {
  // Default values.
  const DEFAULTS = {
    styles: () => 'solid',
    markers: 'square',
    vSep: 1.4,
    hSep: 6,
    columns: 1
  }

  // Build widget from components.
  let { self, api } = compose(
    Widget('legend', name, parent, 'svg'),
    Color,
    Font,
    Highlight(() => _.container, ['.legend-entry']),
    Mouse
  )

  // Private members.
  const _ = {
    entries: [],
    styles: DEFAULTS.styles,
    markers: DEFAULTS.markers,
    vSep: DEFAULTS.vSep,
    hSep: DEFAULTS.hSep,
    columns: DEFAULTS.columns,
    inserted: false,
    container: self._widget.content.append('g')
      .attr('class', 'legend-container'),

    // Methods.
    entryTransform: (d, i) => {
      const fs = parseFloat(self._font.size)
      return `translate(${fs * _.hSep * (i % _.columns)}, ${fs * (0.7 + _.vSep * Math.floor(i / _.columns))})`
    },

    makeMarker (elem) {
      // Remove existing shape.
      elem.select('.legend-entry-marker-shape')
        .remove()

      // Add shape.
      let shape
      switch (_.markers) {
        case 'square':
          shape = elem.append('rect')
            .attr('x', 0)
            .attr('y', '-.5em')
            .attr('width', '1em')
            .attr('height', '1em')
            .attr('rx', 2)
            .attr('ry', 2)
          break
        case 'circle':
          shape = elem.append('circle')
            .attr('cx', '.5em')
            .attr('cy', 0)
            .attr('r', '.5em')
          break
        default:
          shape = elem.append('path')
            .attr('d', _.markers)
            .attr('transform', `translate(${parseFloat(self._font.size) / 2}, 0)`)
      }

      // Add class and style
      shape.attr('class', 'legend-entry-marker-shape')
        .attr('mask', _.styles)
    },

    update (duration) {
      // Font metrics to position the markers.
      const fm = self._widget.getFontMetrics()

      // Legend transitions.
      const t = _.container.transition().duration(duration)

      // Transform container with the margins if not inserted.
      if (!_.inserted) {
        t.attr('transform', `translate(${parseFloat(self._widget.margins.left)}, ${parseFloat(self._widget.margins.top)})`)
      }

      _.container.selectAll('.legend-entry')
        .data(_.entries, d => d.name)
        .join(
          // Entering entries.
          enter => {
            const entry = enter.append('g')
              .attr('class', d => `legend-entry ${encode(d.name)}`)
              // TODO Get rid of hard coded dy values.
              .attr('transform', _.entryTransform)
              .style('shape-rendering', 'geometricPrecision')
              .style('opacity', 0)
              .style('pointer-events', self._mouse.hasAny() ? 'all' : 'none')
              .style('cursor', self._mouse.hasAny() ? 'pointer' : 'default')
              .on('mouseover', d => self._mouse.over(d.name))
              .on('mouseleave', d => self._mouse.leave(d.name))

            // Fade in.
            entry.transition(t)
              .style('opacity', 1)

            // Add marker group.
            // TODO Add mask using style.
            const marker = entry.append('g')
              .attr('class', 'legend-entry-marker')
              .attr('fill', self._color.mapper)

            // Add marker.
            marker.call(_.makeMarker, fm)
              .attr('font-size', self._font.size)

            // Add label.
            entry.append('text')
              .attr('class', 'legend-entry-label')
              .attr('text-anchor', 'start')
              .attr('dominant-baseline', 'central')
              .attr('font-size', self._font.size)
              .attr('dx', 1.3 * parseFloat(self._font.size))
              .text(d => d.name)

            return entry
          },

          // Updated entries.
          // TODO Update style.
          update => {
            // Update entry.
            update.style('cursor', self._mouse.hasAny() ? 'pointer' : 'default')
              .style('pointer-events', self._mouse.hasAny() ? 'all' : 'none')
              .transition(t)
              .attr('transform', _.entryTransform)
              .style('opacity', 1)

            // Update marker.
            update.select('.legend-entry-marker')
              .attr('font-size', self._font.size)
              .call(_.makeMarker, fm)
              .transition(t)
              .attr('fill', self._color.mapper)

            // Update label.
            update.select('.legend-entry-label')
              .text(d => d.name)

            return update
          },

          // Exiting entries.
          exit => exit.transition(t)
            .style('opacity', 0)
            .remove()
        )

      // TODO Assign mouse events to entries.
    }
  }

  // Extend widget update.
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API.
  api = Object.assign(api, {
    /**
     * Sets the entries of the legend. Legend entries follow the same order as provided by this method.
     *
     * @method entries
     * @methodOf Legend
     * @param {Object[]} entries Array of objects representing the legend entries. Each entry is defined by a {name} and
     * a {label} property. The name is used for coloring, styling and interactions whereas the label is the displayed
     * name of the entry.
     * @returns {Object} Reference to the Legend's API.
     * @example
     *
     * // Set labels to the legend.
     * const legend = dalian.Legend('my-legend')
     *   .entries([
     *     {name'a', label: 'Apple'},
     *     {name: 'b', label: 'Banana'},
     *     {name: 'c', label: 'Cranberries'}
     *   ])
     *   .render()
     *
     * // Change labels.
     * legend.entries([
     *   {name: 'a', label: 'Alice'},
     *   {name: 'b', label: 'Bob'},
     *   {name: 'c', label: 'Charlie'}
     * ]).render()
     */
    entries (entries) {
      _.entries = entries.map(name => ({ name }))
      return api
    },

    /**
     * Sets the background style of the legend entry markers.
     *
     * @method styles
     * @methodOf Legend
     * @param {Object} styles Object mapping from the entry names to style strings. If an entry's name is not present in
     * the mapping, it defaults to solid. Default value is solid for all entries. A typical parameter is the return
     * value from the <a href="../components/line-style.html">LineStyle</a> component's mapper function.
     * @returns {Object} Reference to the Legend's API.
     * @example
     *
     * // Set styles.
     * const legend = dalian.Legend('my-legend')
     *   .entries([
     *     {name: 'a', label: 'Alice'},
     *     {name: 'b', label: 'Bob'},
     *     {name: 'c', label: 'Charlie'}
     *   ])
     *   .styles({
     *     b: 'dashed',
     *     c: 'dotted'
     *   }).render()
     */
    styles (styles = DEFAULTS.styles) {
      _.styles = d => Patterns.get(styles[d.name])
      return api
    },

    /**
     * Sets the legend marker shape.
     *
     * @method markers
     * @methodOf Legend
     * @param {string} [markers = square] Marker shape. Either one of the supported values (square, circle) or a custom
     * path. In case of a custom marker, the passed string is used as the d attribute of a path. Note that the path
     * origin is set to the center of the square marker.
     * @returns {Object} Reference to the Legend's API.
     * @example
     *
     * // Set markers to circles.
     * const legend = dalian.Legend('my-legend')
     *   .markers('circle')
     *   .render()
     *
     * // Set markers to an equilateral triangle.
     * legend.markers('m -0.5 4.33 l 0.5 -8.66 l 0.5 8.66 z')
     *   .render()
     */
    markers (markers = DEFAULTS.markers) {
      _.markers = markers
      return api
    },

    /**
     * Sets the number of columns to organize legend entries in.
     *
     * @method columns
     * @methodOf Legend
     * @param {number} [columns = 1] Number of columns.
     * @returns {Object} Reference to the Legend's API.
     * @example
     *
     * // Have 3 columns in the legend.
     * const legend = dalian.Legend('my-legend')
     *   .columns(3)
     *   .render()
     *
     * // Reset to single column.
     * legend.columns()
     *   .render()
     */
    columns (columns = DEFAULTS.columns) {
      _.columns = columns
      return api
    },

    /**
     * Sets the vertical separation between the legend entries. The separation is measured between the baseline of the
     * entry labels.
     *
     * @method vSep
     * @methodOf Legend
     * @param {number} [length = 1.4] Size of the vertical separation in units of the current font size.
     * @returns {Object} Reference to the Legend's API.
     * @example
     *
     * // Set vertical separation to 2 em.
     * const legend = dalian.Legend('my-legend')
     *   .vSep(2)
     *   .render()
     *
     * // Reset vertical separation to 1.4 em.
     * legend.vSep()
     *   .render()
     */
    vSep (length = DEFAULTS.vSep) {
      _.vSep = length
      return api
    },

    /**
     * Sets the horizontal separation between the legend entries. The separation is measured between the center of the
     * entry markers.
     *
     * @method hSep
     * @methodOf Legend
     * @param {number} [length = 6] Size of the horizontal separation in units of the current font size.
     * @returns {Object} Reference to the Legend's API.
     * @example
     *
     * // Set horizontal separation to 10 em.
     * const legend = dalian.Legend('my-legend')
     *   .hSep(10)
     *   .render()
     *
     * // Reset vertical separation to 6 em.
     * legend.hSep()
     *   .render()
     */
    hSep (length = DEFAULTS.hSep) {
      _.hSep = length
      return api
    },

    /**
     * Inserts the legend in a widget if that widget supports the <a href="../components/objects.html">Objects</a>
     * component. Note that this will remove the legend's widget as such and makes the legend part of the parent widget.
     * However, all Legend API methods continue to function as expected.
     *
     * @method insert
     * @methodOf Legend
     * @param {Widget} widget Any widget that supports inserting objects. If not specified, the legend is removed from
     * the current parent widget (if there is any).
     * @param {Object} pos Object representing the position within the widget where the legend should be inserted.
     * @returns {Object} Reference to the Legend's API.
     * @example
     *
     * // Insert legend in the top left corner of a chart called 'figure'.
     * const legend = dalian.Legend('my-legend')
     *   ...
     *   .render()
     * legend.insert(figure, {x: 10, y: 10}).
     *
     * // Remove the legend from 'figure' and move it back to its own container.
     * legend.insert()
     */
    insert (widget, pos) {
      if (typeof widget !== 'undefined' && typeof widget.objects !== 'undefined') {
        // Remove container transform and insert legend to widget.
        widget.objects.add(`${widget.id()}-legend`, _.container.attr('transform', null).node(), pos, {
          foreground: true
        })

        // Disable container.
        self._widget.container.style('display', 'none')
        _.inserted = true
      } else {
        // Move legend back to its own widget.
        self._widget.content.append(() => _.container
          .attr('transform', `translate(${parseFloat(self._widget.margins.left)}, ${parseFloat(self._widget.margins.top)})`).node())

        // Enable container.
        self._widget.container.style('display', null)
        _.inserted = false
      }

      return api
    }
  })

  return api
}
