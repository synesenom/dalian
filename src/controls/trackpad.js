import { drag, event } from 'd3'
import extend from '../core/extend'
import compose from '../core/compose'
import BottomAxis from '../components/axis/bottom-axis'
import Font from '../components/font'
import LeftAxis from '../components/axis/left-axis'
import Scale from '../components/scale'
import Widget from '../components/widget'
import { lighter } from '../utils/color'

// TODO Move style to head.
// TODO Implement radial type.
// TODO Make it touch compatible.
/**
 * The trackpad control widget. Inherits all API from the [Widget]{@link ../components/widget.html} component. The trackpad is constrained to a rectangle defined by the width/height and the margins (it fills  the container as much as the margins allow).
 *
 * @function Trackpad
 * @param {string} name Name of the widget. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
export default (name, parent = 'body') => {
  // Default values.
  const DEFAULTS = {
    color: 'grey',
    guide: false,
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
    Widget('trackpad', name, parent, 'svg'),
    BottomAxis(scales.x),
    LeftAxis(scales.y),
    Font
  )

  // Private members.
  const _ = {
    scales,

    // Internal variables.
    internal: Object.assign({}, DEFAULTS),

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
        .attr('rx', 3)
        .attr('ry', 3)

      // Guide.
      const guide = (() => {
        // Clip path to cut guides outside the trackpad.
        const clipId = `${self._widget.id}-guides-clipper`
        const clip = self._widget.getDefs().append('clipPath')
          .attr('id', clipId)
          .append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('rx', 3)
          .attr('ry', 3)
          .attr('width', self._widget.size.innerWidth)
          .attr('height', self._widget.size.innerHeight)

        // Guide container.
        const g = container.append('g')
          .attr('class', 'trackpad-guides')
          .attr('clip-path', `url(#${clipId})`)

        // Return elements of the guide that need update.
        return {
          clip,
          x: g.append('line')
            .attr('class', 'trackpad-guide-x')
            .attr('x1', 0)
            .attr('stroke-dasharray', '2 4'),
          y: g.append('line')
            .attr('class', 'trackpad-guide-y')
            .attr('y1', 0)
            .attr('stroke-dasharray', '2 4')
        }
      })()

      // Handle.
      const handle = container.append('circle')
        .attr('class', 'trackpad-handle')
        .attr('r', 8)
        .attr('fill', '#fff')

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
            handle.attr('fill', _.internal.color)
              .attr('stroke', '#fff')
              .attr('stroke-width', 2)

            // Calculate value.
            _.updateValues()

            // Update handle position.
            _.updateHandle(_.dom.handle, _.dom.guide)

            // Callback.
            _.internal.callback && _.internal.callback(_.internal.values)
          })
          .on('end', () => {
            handle.attr('fill', '#fff')
              .attr('stroke', _.internal.color)
              .attr('stroke-width', 1)
          })
        )

      return {
        container,
        track,
        guide,
        handle,
        overlay
      }
    })(),

    updateValues (initialValues) {
      const x = typeof initialValues === 'undefined' ? event.x : _.scales.x.scale(initialValues[0])
      const y = typeof initialValues === 'undefined' ? event.y : _.scales.y.scale(initialValues[1])
      _.internal.values = [
        Math.max(_.internal.ranges[0][0], Math.min(_.internal.ranges[0][1], _.scales.x.scale.invert(x))),
        Math.max(_.internal.ranges[1][0], Math.min(_.internal.ranges[1][1], _.scales.y.scale.invert(y)))
      ]
    },

    updateHandle (handle, guide) {
      const x = _.scales.x.scale(_.internal.values[0]) + 0.5
      const y = _.scales.y.scale(_.internal.values[1]) + 0.5
      handle.attr('cx', x)
        .attr('cy', y)
        .attr('stroke', _.internal.color)
      guide.clip.attr('width', self._widget.size.innerWidth)
        .attr('height', self._widget.size.innerHeight)
      guide.x.attr('x2', self._widget.size.innerWidth)
        .attr('y1', y)
        .attr('y2', y)
        .attr('stroke', _.internal.color)
      guide.y.attr('x1', x)
        .attr('x2', x)
        .attr('y2', self._widget.size.innerHeight)
        .attr('stroke', _.internal.color)
    },

    update (duration) {
      // Update scales.
      _.scales.x.range(0, parseFloat(self._widget.size.innerWidth))
        .domain(_.internal.ranges[0])
      _.scales.y.range(parseFloat(self._widget.size.innerHeight), 0)
        .domain(_.internal.ranges[1])

      // Update internals.
      _.updateValues(_.internal.values)

      // Adjust container.
      self._widget.getElem(_.dom.container, duration)
        .attr('transform', `translate(${self._widget.margins.left}, ${self._widget.margins.top})`)

      // Adjust track and overlay.
      self._widget.getElem(_.dom.track, duration)
        .attr('width', self._widget.size.innerWidth)
        .attr('height', self._widget.size.innerHeight)
        .attr('fill', lighter(_.internal.color, 0.8))
        .attr('stroke', _.internal.color)
      self._widget.getElem(_.dom.overlay, duration)
        .attr('width', parseFloat(self._widget.size.innerWidth) + 20)
        .attr('height', parseFloat(self._widget.size.innerHeight) + 20)

      // Adjust guide and handle.
      _.updateHandle(
        self._widget.getElem(_.dom.handle, duration), {
          clip: self._widget.getElem(_.dom.guide.clip, duration),
          x: self._widget.getElem(_.dom.guide.x, duration)
            .style('opacity', _.internal.guide ? 1 : 0),
          y: self._widget.getElem(_.dom.guide.y, duration)
            .style('opacity', _.internal.guide ? 1 : 0)
        }
      )
    }
  }

  // Extend widget update.
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API.
  api = Object.assign(api, {
    /**
     * Binds a callback to the trackpad. Note that this  is called every time the handle is dragged (you may want to debounce it).
     *
     * @method callback
     * @methodOf Trackpad
     * @param {Function} callback Callback to bind when the handle is dragged. The current values are passed as two separate parameters.
     * @returns {Trackpad} Reference to the Trackpad API.
     * @example
     *
     * // Print current values to console.
     * const trackpad = dalian.Trackpad('my-control')
     *   .callback((x, y) => console.log(x, y))
     *   .render()
     *
     * // Remove callback.
     * trackpad.callback()
     *   .render()
     */
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
     * @example
     *
     * // Set trackpad color.
     * const trackpad = dalian.Trackpad('my-control')
     *   .color('royalblue')
     *   .render()
     *
     * // Reset color.
     * trackpad.color()
     *   .render()
     */
    color (color = DEFAULTS.color) {
      _.internal.color = color
      return api
    },

    /**
     * Sets one/all of the axis formats. If null or undefined is passed to any of the formats that axis is reversed to the default format.
     *
     * @method format
     * @methodOf Trackpad
     * @param {(Function|null)?} [format1 = x => x] First (x) format.
     * @param {(Function|null)?} [format2 = x => x] Second (y) format.
     * @returns {Trackpad} Reference to the Trackpad API.
     * @example
     *
     * // Set both formats.
     * const trackpad = dalian.Trackpad('my-control')
     *   .formats(x => x + '%', y => y + 'mm')
     *   .render()
     *
     * // Set the first format and reset the second.
     * trackpad.format(x => x.toFixed(2))
     *   .render()
     *
     * // Reset the first format and set the second.
     * trackpad.format(null, y => y + 'cm')
     *   .render()
     *
     * // Reset both axes.
     * trackpad.format()
     *   .render()
     */
    format (format1, format2) {
      self._bottomAxis.format(format1)
      self._leftAxis.format(format2)
      return api
    },

    /**
     * Turns on/off guiding lines.
     *
     * @method guide
     * @methodOf Trackpad
     * @param {boolean} [on = false] Whether to turn on guiding lines.
     * @returns {Trackpad} Reference to the Trackpad API.
     * @example
     *
     * // Show guides.
     * const trackpad = dalian.Trackpad('my-control')
     *   .guide(true)
     *   .render()
     *
     * // Turn off guides.
     * trackpad.guide()
     *   .render()
     */
    guide (on = DEFAULTS.guide) {
      _.internal.guide = on
      return api
    },

    /**
     * Sets one/all of the axis labels. If null or undefined is passed to any of the labels that label is reset to default.
     *
     * @method label
     * @methodOf Trackpad
     * @param {(string|null)?} [label1 = ''] First (x) label.
     * @param {(string|null)?} [label2 = ''] Second (y) label.
     * @returns {Trackpad} Reference to the Trackpad API.
     * @example
     *
     * // Set both labels.
     * const trackpad = dalian.Trackpad('my-control')
     *   .label('x', 'y')
     *   .render()
     *
     * // Set the first label and reset second.
     * trackpad.label('distance')
     *   .render()
     *
     * // Reset first label and set second.
     * trackpad.label(null, 'velocity')
     *   .render()
     *
     * // Reset both labels.
     * trackpad.label()
     *   .render()
     */
    label (label1, label2) {
      api.bottomAxis.label(label1)
      api.leftAxis.label(label2)
      return api
    },

    /**
     * Sets the range to one or both axes. If null or undefined is passed to any of the ranges that range remains unchanged.
     *
     * @method range
     * @methodOf Trackpad
     * @param {(number[]|null)?} range1 First (x) range.
     * @param {(number[]|null)?} range2 Second (y) range.
     * @returns {Trackpad} Reference to the Trackpad API.
     * @example
     *
     * // Set both ranges.
     * const trackpad = dalian.Trackpad('my-control')
     *   .range([1, 2], [3, 4])
     *   .render()
     *
     * // Set the first range only.
     * trackpad.range([0.1, 3.4])
     *   .render()
     *
     * // Set the second range only.
     * trackpad.range(null, [4, 5])
     *   .render()
     */
    range (range1, range2) {
      _.internal.ranges = [
        Array.isArray(range1) ? range1 : _.internal.range[0],
        Array.isArray(range2) ? range2 : _.internal.range[1]
      ]
      return api
    },

    /**
     * Sets one/all of the trackpad values. If null or undefined is passed to any of the values that value remains unchanged.
     *
     * @method value
     * @methodOf Trackpad
     * @param {(number|null)?} value1 First (x) value.
     * @param {(number|null)?} value2 Second (y) value.
     * @returns {Trackpad} Reference to the Trackpad API.
     * @example
     *
     * // Set both values.
     * const trackpad = dalian.Trackpad('my-control')
     *   .value(1, 2)
     *   .render()
     *
     * // Set the first value only.
     * trackpad.value(3)
     *   .render()
     *
     * // Set the second value only.
     * trackpad.value(null, 4)
     *   .render()
     */
    value (value1, value2) {
      _.internal.values = [
        typeof value1 === 'number' ? value1 : _.internal.values[0],
        typeof value2 === 'number' ? value2 : _.internal.values[1]
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