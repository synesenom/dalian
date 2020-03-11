import { select } from 'd3'
import BaseTooltip from './base-tooltip'

/**
 * Factory implementing the point tooltip component. The point tooltip is a pre-formatted tooltip that takes an array of
 * plot data and displays it in the tooltip as a list of plots with colored square markers. Can be used in charts where
 * the tooltip displays info at a specific point of the widget (hence the name), such as line charts or heat maps.
 *
 * @function PointTooltip
 * @param {Object} self Object containing the protected variables and methods.
 * @param {Object} api Object containing the public API methods.
 * @returns {{self: Object, api: Object}} Object containing the extended protected and public containers.
 */
export default (self, api) => {
  // Inherit from base tooltip
  let base = BaseTooltip(self, api)

  // Protected members
  self._tooltip = Object.assign(base.self._tooltip, {
    // Override methods
    builder: content => {
      if (typeof content === 'undefined') {
        self._tooltip.content()
        return undefined
      }

      // Create content node
      let contentNode = select(document.createElement('div'))
        .style('width', '100%')

      // Add title
      contentNode.append('div')
        .style('display', 'inline-block')
        .style('position', 'relative')
        .style('width', '100%')
        .style('margin-bottom', '8px')
        .text(self._tooltip.xFormat(content.title))

      // TODO Remove this: add to ElementTooltip

      // Add content
      content.content.data.sort((a, b) => a.name.localeCompare(b.name))
        .forEach(plot => {
          let entry = contentNode.append('div')
            .style('display', 'inline-block')
            .style('position', 'relative')
            .style('width', '100%')
            .style('margin-top', '5px')
          entry.append('div')
            .style('display', 'inline-block')
            .style('position', 'relative')
            .style('width', '9px')
            .style('height', '9px')
            .style('float', 'left')
            .style('background', plot.background)
          entry.append('div')
            .style('display', 'inline-block')
            .style('position', 'relative')
            .style('width', 'calc(100% - 20px)')
            .style('float', 'right')
            .html(self._tooltip.yFormat(plot.value))
        })

      return contentNode.node().outerHTML
    },

    // New members
    xFormat: x => x,
    yFormat: x => x,
  })

  // Extend API
  api = Object.assign(base.api, {
    /**
     * Sets the format of the X component's value in the tooltip.
     *
     * @method tooltipXFormat
     * @methodOf PointTooltip
     * @param {Function} [format = x => x] Function to use as the formatter. May take one parameter which is the X value
     * and must return a string. The return value can be HTML formatted.
     * @returns {Object} Reference to the PointTooltip API.
     */
    tooltipXFormat: (format = x => x) => {
      self._tooltip.xFormat = format
      return api
    },

    /**
     * Sets the format of the Y component's value in the tooltip.
     *
     * @method tooltipYFormat
     * @methodOf PointTooltip
     * @param {Function} [format = x => x] Function to use as the formatter. May take one parameter which is the Y value
     * and must return a string. The return value can be HTML formatted.
     * @returns {Object} Reference to the PointTooltip API.
     */
    tooltipYFormat: (format = x => x) => {
      self._tooltip.yFormat = format
      return api
    }
  })

  return {self, api}
}
