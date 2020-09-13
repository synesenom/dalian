import compose from '../core/compose'
import extend from '../core/extend'
import wong from '../components/palettes/wong'
import Widget from '../components/widget'
import Font from '../components/font'
import Highlight from '../components/highlight'
import Mouse from '../components/mouse'
import encode from '../core/encode'


export default (name, parent = 'body') => {
  // Default values.
  const DEFAULTS = {
    // Wong palette is used as default colors.
    colors: (() => {
      const keys = []
      return d => {
        const i = keys.indexOf(d)
        return wong[i > -1 ? i : keys.push(d) - 1]
      }
    })(),
    styles: null,
    markers: 'square',
    columns: 1,
  }

  // Build widget from components.
  let { self, api } = compose(
    Widget('legend', name, parent, 'svg'),
    Font,
    Highlight(() => _.container, ['.legend-entry']),
    Mouse
  )

  // Private members.
  const _ = {
    entries: [],
    colors: DEFAULTS.colors,
    styles: DEFAULTS.styles,
    markers: DEFAULTS.markers,
    container: self._widget.content.append('g')
      .attr('class', 'legend-container'),

    // Methods.
    entryTransform: (d, i) => `translate(0, ${parseFloat(self._font.size) * (0.7 + 1.4 * i)})`,

    makeMarker (elem, fm) {
      // Remove existing shape.
      elem.select('.legend-entry-marker-shape')
        .remove()

      let shape
      switch (_.markers) {
        case 'square':
          shape = elem.append('rect')
            .attr('x', 0)
            .attr('y', '-.5em')
            .attr('width', (1 - fm.descender) + 'em')
            .attr('height', (1 - fm.descender) + 'em')
          break
        case 'circle':
          shape = elem.append('circle')
            .attr('cx', '.5em')
            .attr('cy', (fm.ascender - 1) / 2 + 'em')
            .attr('r', fm.ascender / 2 + 'em')
          break
        default:
          shape = elem.append('path')
            .attr('d', _.markers)
            .attr('transform', `translate(${parseFloat(self._font.size) / 2}, ${(fm.ascender - 1) * parseFloat(self._font.size) / 2})`)
      }

      shape.attr('class', 'legend-entry-marker-shape')
    },

    update (duration) {
      // Font metrics to position the markers.
      const fm = self._widget.getFontMetrics()

      // Legend transitions.
      const t = _.container.transition().duration(duration)

      // TODO Add entries (d3 selections from _.labels as data).
      _.container.selectAll('.legend-entry')
        .data(_.entries, d => d.key)
        .join(
          // Entering entries.
          enter => {
            const entry = enter.append('g')
              .attr('class', d => `legend-entry ${encode(d.key)}`)
              // TODO Get rid of hard coded dy values.
              .attr('transform', _.entryTransform)
              .style('shape-rendering', 'geometricPrecision')
              .style('opacity', 0)
              .style('pointer-events', self._mouse.hasAny() ? 'all' : 'none')
              .style('cursor', self._mouse.hasAny() ? 'pointer' : 'default')
              .on('mouseover', d => self._mouse.over(d.key))
              .on('mouseleave', d => self._mouse.leave(d.key))

            // Fade in.
            entry.transition(t)
              .style('opacity', 1)

            // Add marker group.
            // TODO Add mask using style.
            const marker = entry.append('g')
              .attr('class', 'legend-entry-marker')
              .attr('fill', _.colors)

            // Add marker.
            marker.call(_.makeMarker, fm)
              .attr('font-size', self._font.size)

            // Add label.
            entry.append('text')
              .attr('class', 'legend-entry-label')
              .attr('text-anchor', 'start')
              .attr('dominant-baseline', 'middle')
              .attr('font-size', self._font.size)
              .attr('dx', 1.3 * parseFloat(self._font.size))
              .text(d => d.label)

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
              .attr('fill', _.colors)

            // Update label.
            update.select('.legend-entry-label')
              .text(d => d.label)

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
     * @method labels
     * @methodOf Legend
     * @param {Object[]} entries Array of objects representing the legend entries. Each entry is defined by a {key} and
     * a {label} property. The key is used for coloring, styling and interactions whereas the label is the displayed
     * name of the entry.
     * @returns {Object} Reference to the Legend's API.
     * @example
     *
     * // Set labels to the legend.
     * const legend = dalian.Legend('my-legend')
     *   .entries([
     *     {key: 'a', label: 'Apple'},
     *     {key: 'b', label: 'Banana'},
     *     {key: 'c', label: 'Cranberries'}
     *   ])
     *   .render()
     *
     * // Change labels.
     * legend.entries([
     *   {key: 'a', label: 'Alice'},
     *   {key: 'b', label: 'Bob'},
     *   {key: 'c', label: 'Charlie'}
     * ]).render()
     */
    entries (entries) {
      _.entries = entries
      return api
    },

    /**
     * Sets the color of the legend entry markers.
     *
     * @method colors
     * @methodOf Legend
     * @param {(object|function)} colors Object mapping from the entry keys to color strings or function that takes the
     * entry (with key and label) and returns a color string.
     * @returns {Object} Reference to the Legend's API.
     * @example
     *
     * // Set colors.
     * const legend = dalian.Legend('my-legend')
     *   .entries([
     *     {key: 'a', label: 'Alice'},
     *     {key: 'b', label: 'Bob'},
     *     {key: 'c', label: 'Charlie'}
     *   ])
     *   .colors({
     *     a: 'blue',
     *     b: 'green',
     *     c: 'yellow'
     *   }).render()
     *
     * // Change colors to a function.
     * legend.colors(d => d.key === 'a' ? 'blue' : 'green')
     *   .render()
     */
    colors (colors = DEFAULTS.colors) {
      _.colors = typeof colors === 'object' ? d => colors[d.key] : d => colors(d.key)
      return api
    },

    // TODO Implement.
    styles (styles = DEFAULTS.styles) {
      _.styles = styles
      return api
    },

    /**
     * Sets the legend marker shape.
     *
     * @method markers
     * @methodOf Legend
     * @param {string} markers Marker shape. Either one of the supported values (square, circle) or a custom path. In
     * case of a custom marker, the passed string is used as the d attribute of a path. Note that the path will be
     * centered so the definition should take that into account.
     * @returns {Object} Reference to the Legend's API.
     * @todo example
     */
    markers (markers = DEFAULTS.markers) {
      _.markers = markers
      return api
    },

    // TODO Implement.
    columns (columns = DEFAULTS.columns) {
      _.columns = columns
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
     * @todo example
     */
    insert (widget, pos) {
      if (typeof widget !== 'undefined' && typeof widget.objects !== 'undefined') {
        // Insert legend to widget.
        widget.objects.add(`${widget.id()}-legend`, _.container.node(), pos, {
          foreground: true
        })

        // Disable container.
        self._widget.container.style('display', 'none')
      } else {
        // Move legend back to its own widget.
        self._widget.content.append(() => _.container.node())

        // Enable container.
        self._widget.container.style('display', 'block')
      }

      return api
    }

    // TODO API: legend positioning within widget.
  })

  return api
}
