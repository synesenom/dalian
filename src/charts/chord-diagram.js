import { arc, chord, descending, ribbon } from 'd3'
import compose from '../core/compose'
import Chart from '../components/chart'
import Highlight from '../components/highlight'
import Label from '../components/label'
import extend from '../core/extend'
import { attrTween } from '../utils/tweens'
import encode from '../core/encode'

// Defaults.
const DEFAULTS = {
  radius: 100,
  thickness: 10
}

// TODO Add ticks.
// FIXME Thickness animation is not working.
// FIXME Radius animation is not working.
/**
 * The chord chart widget. As a chart, it extends the [Chart]{@link ../components/chart.html} component, with all of its
 * available APIs. Furthermore, it extends the following components:
 * <ul>
 *   <li>
 *     <a href="../components/highlight.html">Highlight</a> Groups along with their adjacent ribbons can be highlighted by passing their category names as
 *     specified in the data array.
 *   </li>
 *   <li>
 *     <a href="../components/label.html">Label</a> Labels are shown inside the slice if they fit in, otherwise they are
 *     shown outside.
 *   </li>
 * </ul>
 *
 * @function ChordChart
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
export default (name, parent = 'body') => {
  // Build widget.
  let { self, api } = compose(
    Chart('chord-diagram', name, parent),
    Highlight(() => self._chart.plots, ['.chord-ribbon']),
    Label
  )

  // Private methods.
  // TODO Docstring.
  function ribbonId (source, target) {
    source < target ? source + '-' + target : target + '-' + source
  }

  // TODO Docstring.
  function addRibbons (enter, ribbonFn) {
    return enter.append('path')
      .attr('class', d => `chord-ribbon ${encode(d.name)} ${encode(d.name2)}`)
      .attr('fill', 'currentColor')
      .attr('fill-opacity', 0.6)
      .attr('stroke', '#fff')
      .attr('d', ribbonFn)
  }

  // TODO Docstring.
  function textTransform (d) {
    d.angle = (d.startAngle + d.endAngle) / 2
    return `rotate(${d.angle * 180 / Math.PI - 90}) translate(${_.radius - self._widget.margins.left + 5}) ${d.angle > Math.PI ? ' rotate(180)' : ''}`
  }

  // TODO Docstring.
  function textAnchor (d) {
    return (d.startAngle + d.endAngle) / 2 > Math.PI ? 'end' : 'start'
  }

  // Private members.
  const _ = {
    radius: DEFAULTS.radius,
    thickness: DEFAULTS.thickness,
    indexByName: new Map(),
    nameByIndex: new Map(),
    arc: null
  }

  self._chart.transformData = data => {
    _.indexByName.clear()
    _.nameByIndex.clear()
    let index = 0
    let name = 0

    // Build index <-> name mappings.
    data.forEach(d => {
      if (!_.indexByName.has(name = d.source)) {
        _.nameByIndex.set(index, name)
        _.indexByName.set(name, index++)
      }
      if (!_.indexByName.has(name = d.target)) {
        _.nameByIndex.set(index, name)
        _.indexByName.set(name, index++)
      }
    })

    // Build data matrix.
    const matrix = []
    data.forEach(d => {
      const source = _.indexByName.get(d.source)
      const target = _.indexByName.get(d.target)
      if (typeof matrix[source] === 'undefined') {
        matrix[source] = Array(index).fill(0)
      }
      matrix[source][target] = d.value

      if (typeof matrix[target] === 'undefined') {
        matrix[target] = Array(index).fill(0)
      }
    })

    // Create chords function.
    const chordFn = chord()
      .padAngle(0.05)
      .sortGroups(descending)
      .sortSubgroups(descending)

    // Create groups with the names added.
    const chordData = chordFn(matrix)
    const groups = chordData.groups
      .sort((a, b) => b.value - a.value)
      .map(d => Object.assign(d, {
        name: _.nameByIndex.get(d.index),
        ribbons: []
      }))

    // Add ribbons to their target group.
    for (const ribbon of chordData) {
      const g = groups.find(d => d.index === ribbon.source.index)
      g.ribbons.push(Object.assign(ribbon, {
        id: ribbonId(ribbon.source.index, ribbon.target.index),
        name: _.nameByIndex.get(ribbon.source.index),
        name2: _.nameByIndex.get(ribbon.target.index)
      }))
    }

    return groups
  }

  // Extend widget update.
  self._widget.update = extend(self._widget.update, duration => {
    // Create arc.
    const innerRadius = _.radius - _.thickness - self._widget.margins.left
    const outerRadius = _.radius - self._widget.margins.left
    _.arc = arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)

    // Create ribbon.
    const ribbonFn = ribbon()
      .radius(innerRadius - 1)

    // Add plots.
    const t = self._chart.plots
      .transition().duration(duration)
    self._chart.plotGroups({
      enter: g => {
        // Group.
        g.style('color', self._color.mapper)
          .attr('transform', `translate(${parseFloat(self._widget.size.innerWidth) / 2}, ${parseFloat(self._widget.size.innerHeight) / 2})`)
          .style('opacity', 0)

        // Labels.
        g.append('text')
          .attr('class', 'chord-label')
          .attr('dy', '.35em')
          .attr('transform', textTransform)
          .attr('text-anchor', _.textAnchor)
          .style('display', self._label.show ? null : 'none')
          .text(d => d.name)

        // Arcs.
        g.append('path')
          .attr('class', 'chord-arc')
          .attr('d', _.arc)
          .attr('fill', 'currentColor')

        // Ribbons.
        addRibbons(g.selectAll('.chord-ribbon')
          .data(d => d.ribbons, d => d.id).enter(), ribbonFn)

        return g
      },
      updateBefore: g => {
        g.selectAll('.chord-ribbon')
          .data(d => d.ribbons, d => d.id)
          .join(
            enter => addRibbons(enter, ribbonFn)
              .style('opacity', 0),
            update => update,
            exit => exit.transition(t)
              .style('opacity', 0)
              .remove()
          )
          .transition(t)
          .style('opacity', 1)
          .attrTween('d', attrTween(ribbonFn, 'ribbon'))
      },
      update: g => {
        // Update group.
        g.style('color', self._color.mapper)
          .attr('transform', `translate(${parseFloat(self._widget.size.innerWidth) / 2}, ${parseFloat(self._widget.size.innerHeight) / 2})`)
          .style('opacity', 1)

        // Update arcs.
        g.select('.chord-arc')
          .attrTween('d', attrTween(_.arc, 'arc'))

        // Labels.
        g.select('.chord-label')
          .style('display', self._label.show ? null : 'none')
          .attrTween('transform', attrTween(textTransform, 'transform'))
          .attrTween('text-anchor', attrTween(textAnchor, 'textAnchor'))

        return g
      },
      exit: g => g.style('opacity', 0)
    }, duration)
  })

  api = Object.assign(api, {
    /**
     * Sets the radius of the chord chart.
     *
     * @method radius
     * @memberOf ChordDiagram
     * @param {number} [value = 100] Chart radius in pixels.
     * @returns {ChordChart} Reference to the ChordDiagram API.
     * @example
     *
     * // Set radius to 150px.
     * const chord = dalian.ChordDiagram('my-chart')
     *   .radius(150)
     *   .render()
     *
     * // Reset radius.
     * chord.radius()
     *   .render()
     */
    radius (value = DEFAULTS.radius) {
      _.radius = value
      return api
    },

    /**
     * Sets the thickness of the outer arcs.
     *
     * @method thickness
     * @memberOf ChordDiagram
     * @param {number} [value = 10] Thickness of the arcs in pixel.
     * @returns {ChordChart} Reference to the ChordDiagram API.
     * @example
     *
     * // Set thickness to 20px.
     * const chord = dalian.ChordDiagram('my-chart')
     *   .thickness(20)
     *   .render()
     *
     * // Reset thickness.
     * chord.thickness()
     *   .render()
     */
    thickness (value = DEFAULTS.thickness) {
      _.thickness = value
      return api
    }

    /**
     * Set/updates the data that is shown in the chord chart. In the chord chart, each arc along with its ribbons is a plot group in itself, so all
     * methods that operate on plot groups are applied on the arc level.
     *
     * @method data
     * @memberOf ChordDiagram
     * @param {Object[]} plots Array of objects representing the flows from one group to another. Each flow has three properties:
     * <dl>
     *   <dt>source</dt> <dd>{string} Name of the source group.</dd>
     *   <dt>target</dt> <dd>{string} Name of the target group.</dd>
     *   <dt>value</dt> <dd>{number} Flow strength.</dd>
     * </dl>
     * Unspecified elements of the flow matrix are set to 0.
     * @returns {ChordChart} Reference to the ChordDiagram API.
     * @example
     *
     * const chord = dalian.ChordDiagram('my-chart')
     *   .data([
     *     {source: 'group 1', target: 'group 2', value: 21},
     *     {source: 'group 1', target: 'group 3', value: 34},
     *     {source: 'group 2', target: 'group 3', value: 12},
     *     ...
     *   ])
     *   .render()
     */
  })

  return api
}
