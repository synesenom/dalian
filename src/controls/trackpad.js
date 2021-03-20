import { drag, event } from 'd3'
import extend from '../core/extend'
import compose from '../core/compose'
import BottomAxis from '../components/axis/bottom-axis'
import Font from '../components/font'
import LeftAxis from '../components/axis/left-axis'
import Scale from '../components/scale'
import Widget from '../components/widget'
import { lighter } from '../utils/color'

// Default values.
const DEFAULTS = {
  color: 'grey',
  guide: false,
  ranges: [[0, 1], [0, 1]],
  type: 'cartesian',
  values: [0, 0]
}

// TODO Add API .disabled().
// TODO Implement radial type.
// TODO Make it touch compatible.
/**
 * The trackpad control widget. Inherits all API from the [Widget]{@link ../components/widget.html} component. The trackpad is constrained to a rectangle defined by the width/height and the margins (it fills  the container as much as the margins allow). The scale ticks are implemented using <a href="../components/bottom-axis.html">BottomAxis</a> and <a href="../components/left-axis.html">LeftAxis</a>, making all the API for those component available for the trackpad.
 *
 * @function Trackpad
 * @param {string} name Name of the widget. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
export default (name, parent = 'body') => {
  // Build scales.
  const scales = {
    x: Scale(),
    y: Scale()
  }

  // Build widget from components.
  let { self, api } = compose(
    Widget('trackpad', name, parent, 'svg'),
    BottomAxis(scales.x),
    LeftAxis(scales.y),
    Font
  )

  // Private methods.
  // TODO Docstring.
  function updateValues (initialValues) {
    const x = typeof initialValues === 'undefined' ? event.x : scales.x.scale(initialValues[0])
    const y = typeof initialValues === 'undefined' ? event.y : scales.y.scale(initialValues[1])
    _.i.values = [
      Math.max(_.i.ranges[0][0], Math.min(_.i.ranges[0][1], scales.x.scale.invert(x))),
      Math.max(_.i.ranges[1][0], Math.min(_.i.ranges[1][1], scales.y.scale.invert(y)))
    ]
  }

  // TODO Docstring.
  function updateHandle (handle, guide) {
    const x = scales.x.scale(_.i.values[0]) + 0.5
    const y = scales.y.scale(_.i.values[1]) + 0.5
    handle.attr('cx', x)
      .attr('cy', y)
      .attr('stroke', _.i.color)
    guide.clip.attr('width', self._widget.size.innerWidth)
      .attr('height', self._widget.size.innerHeight)
    guide.x.attr('x2', self._widget.size.innerWidth)
      .attr('y1', y)
      .attr('y2', y)
      .attr('stroke', _.i.color)
    guide.y.attr('x1', x)
      .attr('x2', x)
      .attr('y2', self._widget.size.innerHeight)
      .attr('stroke', _.i.color)
  }

  // Private members.
  const _ = {
    // Internal variables.
    i: Object.assign({}, DEFAULTS),

    // DOM.
    // TODO Move these out.
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
            handle.attr('fill', _.i.color)
              .attr('stroke', '#fff')
              .attr('stroke-width', 2)

            // Calculate value.
            updateValues()

            // Update handle position.
            updateHandle(_.dom.handle, _.dom.guide)

            // Callback.
            _.i.callback && _.i.callback(_.i.values)
          })
          .on('end', () => {
            handle.attr('fill', '#fff')
              .attr('stroke', _.i.color)
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
    })()
  }

  // Extend widget update.
  self._widget.update = extend(self._widget.update, duration => {
    // Update scales.
    scales.x.range([0, parseFloat(self._widget.size.innerWidth)])
      .domain(_.i.ranges[0])
    scales.y.range([parseFloat(self._widget.size.innerHeight), 0])
      .domain(_.i.ranges[1])

    // Update internals.
    updateValues(_.i.values)

    // Adjust container.
    self._widget.getElem(_.dom.container, duration)
      .attr('transform', `translate(${self._widget.margins.left}, ${self._widget.margins.top})`)

    // Adjust track and overlay.
    self._widget.getElem(_.dom.track, duration)
      .attr('width', self._widget.size.innerWidth)
      .attr('height', self._widget.size.innerHeight)
      .attr('fill', lighter(_.i.color, 0.8))
      .attr('stroke', _.i.color)
    self._widget.getElem(_.dom.overlay, duration)
      .attr('width', parseFloat(self._widget.size.innerWidth) + 20)
      .attr('height', parseFloat(self._widget.size.innerHeight) + 20)

    // Adjust guide and handle.
    updateHandle(
      self._widget.getElem(_.dom.handle, duration), {
        clip: self._widget.getElem(_.dom.guide.clip, duration),
        x: self._widget.getElem(_.dom.guide.x, duration)
          .style('opacity', _.i.guide ? 1 : 0),
        y: self._widget.getElem(_.dom.guide.y, duration)
          .style('opacity', _.i.guide ? 1 : 0)
      }
    )
  }, true)

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
      _.i.callback = callback
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
      _.i.color = color
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
      _.i.guide = on
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
      _.i.ranges = [
        Array.isArray(range1) ? range1 : _.i.range[0],
        Array.isArray(range2) ? range2 : _.i.range[1]
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
      _.i.values = [
        typeof value1 === 'number' ? value1 : _.i.values[0],
        typeof value2 === 'number' ? value2 : _.i.values[1]
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
