import { drag, event } from 'd3'
import extend from '../core/extend'
import compose from '../core/compose'
import BottomAxis from '../components/axis/bottom-axis'
import Description from '../components/description'
import Font from '../components/font'
import LeftAxis from '../components/axis/left-axis'
import Placeholder from '../components/placeholder'
import Scale from '../components/scale'
import Widget from '../components/widget'
import {lighter} from '../utils/color'

// TODO Implement radial type.
// TODO Add labels to axes.
// TODO Make it touch compatible.
/**
 * The trackpad control widget.
 *
 * @function Trackpad
 * @param {string} name Name of the widget. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
export default (name, parent = 'body') => {
  // Default values.
  const DEFAULTS = {
    color: 'grey',
    labels: ['', ''],
    ranges: [[0, 1], [0, 1]],
    type: 'cartesian',
    values: [0, 0]
  }

  // Build scales.
  const scales = {
    x: Scale('linear'),
    y: Scale('linear')
  }

  // Build widget from components.
  let { self, api } = compose(
    Widget('slider', name, parent, 'svg'),
    BottomAxis(scales.x),
    Description,
    LeftAxis(scales.y),
    Placeholder,
    Font
  )

  // Private members.
  const _ = {
    scales,

    // UI elements.
    ui: {
      color: DEFAULTS.color,
      labels: DEFAULTS.labels,
      ranges: DEFAULTS.ranges
    },

    internal: {
      type: DEFAULTS.type,
      values: DEFAULTS.values
    },

    // DOM.
    dom: (() => {
      // Container.
      const container = self._widget.content.append('g')
        .attr('class', 'dalian-trackpad-container')

      // Track.
      const track = container.append('rect')
        .attr('class', 'trackpad-track')
        .attr('x', 0)
        .attr('y', 0)
        .attr('rx',  3)
        .attr('ry',  3)

      // TODO Guides.

      // Overlay: to catch clicks on the track itself.
      const overlay = container.append('rect')
        .attr('class', 'trackpad-overlay')
        .attr('x', -10)
        .attr('y', -10)
        .attr('fill', 'none')
        .attr('stroke', 'none')
        .style('cursor', 'pointer')
        .style('pointer-events', 'all')
        .call(drag()
          .on('start drag', () => {
            handle.attr('fill', _.ui.color)
              .attr('stroke', '#fff')
              .attr('stroke-width', 2)

            // Calculate value.
            _.updateValues()

            // Update handle position.
            _.dom.handle.attr('cx', _.scales.x.scale(_.internal.values[0]) + 0.5)
              .attr('cy', _.scales.y.scale(_.internal.values[1]) + 0.5)
            _.internal.callback && _.internal.callback(_.internal.values)
          })
          .on('end', () => {
            handle.attr('fill', '#fff')
              .attr('stroke', _.ui.color)
              .attr('stroke-width', 1)
          })
        )

      // Handle.
      const handle = container.append('circle')
        .attr('class', 'trackpad-handle')
        .attr('r', 8)
        .attr('fill', '#fff')

      return {
        container,
        track,
        overlay,
        handle
      }
    })(),

    updateValues (initialValues) {
      const x = typeof initialValues === 'undefined' ? event.x : _.scales.x.scale(initialValues[0])
      const y = typeof initialValues === 'undefined' ? event.y : _.scales.y.scale(initialValues[1])
      _.internal.values = [
        Math.max(_.ui.ranges[0][0], Math.min(_.ui.ranges[0][1], _.scales.x.scale.invert(x))),
        Math.max(_.ui.ranges[1][0], Math.min(_.ui.ranges[1][1], _.scales.y.scale.invert(y)))
      ]
    },

    update (duration) {
      // Update scales.
      _.scales.x.range(0, parseFloat(self._widget.size.innerWidth))
        .domain(_.ui.ranges[0])
      _.scales.y.range(parseFloat(self._widget.size.innerHeight), 0)
        .domain(_.ui.ranges[1])

      // Update internals.
      _.updateValues(_.internal.values)

      // Adjust container.
      self._widget.getElem(_.dom.container,  duration)
        .attr('transform', `translate(${self._widget.margins.left}, ${self._widget.margins.top})`)

      // Adjust track and overlay.
      self._widget.getElem(_.dom.track, duration)
        .attr('width', self._widget.size.innerWidth)
        .attr('height', self._widget.size.innerHeight)
        .attr('fill', lighter(_.ui.color, 0.8))
        .attr('stroke', _.ui.color)
      self._widget.getElem(_.dom.overlay, duration)
        .attr('width', parseFloat(self._widget.size.innerWidth) + 20)
        .attr('height', parseFloat(self._widget.size.innerHeight) + 20)

      // Adjust value and handle.
      self._widget.getElem(_.dom.handle, duration)
        .attr('cx', _.scales.x.scale(_.internal.values[0]) + 0.5)
        .attr('cy', _.scales.y.scale(_.internal.values[1]) + 0.5)
        .attr('stroke', _.ui.color)
    }
  }

  // Extend widget update.
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API.
  api = Object.assign(api, {
    callback (callback) {
      _.internal.callback = callback
      return api
    },

    /**
     * Sets the color of the trackpad.
     *
     * @method color
     * @methodOf Trackpad
     * @param {string} [color = grey] Color to set.
     * @returns {Trackpad} Reference to the Trackpad API.
     * @example TODO
     */
    color (color = DEFAULTS.color) {
      _.ui.color = color
      return api
    },

    // TODO .guides()

    // TODO .format
    format (format1, format2) {
      self._bottomAxis.format(format1)
      self._leftAxis.format(format2)
      return api
    },

    labels (label1, label2) {
      api.bottomAxis.label(label1)
      api.leftAxis.label(label2)
      return api
    },

    ranges (range1, range2) {
      _.ui.ranges = [
        range1 || _.ui.ranges[0],
        range2 || _.ui.ranges[1]
      ]
      return api
    },

    // TODO .type()

    values (value1, value2) {
      _.internal.values = [
        value1 || _.internal.values[0],
        value2 || _.internal.values[1]
      ]
      return api
    }
  })

  // Adjust axes.
  self._bottomAxis.hideAxisLine(true)
    .hideTicks(true)
  self._leftAxis.hideAxisLine(true)
    .hideTicks(true)

  return api
}
