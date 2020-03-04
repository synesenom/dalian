import { select } from 'd3'
import BaseTooltip from './base-tooltip'

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
        .style('border-radius', '2px')
        .style('padding', '5px')
        .style('font-family', 'inherit')
        .style('border-left', content.stripe ? 'solid 4px ' + content.stripe : null)

      // Add title
      contentNode
        .append('div')
        .style('position', 'relative')
        .style('width', 'calc(100% - 10px)')
        .style('line-height', '11px')
        .style('margin', '5px')
        .style('margin-bottom', '10px')
        .text(self._tooltip.xFormat(content.title))

      // Add content
      content.content.data.forEach(item => {
          let entry = contentNode.append('div')
            .style('position', 'relative')
            .style('height', '10px')
            .style('margin', '5px')
            .style('padding-right', '10px')
            .style('line-height', '11px')
          entry.append('div')
            .style('position', 'relative')
            .style('float', 'left')
            .style('margin-right', '10px')
            .text(item.name + ':')
          entry.append('span')
            .style('position', 'relative')
            .style('float', 'left')
            .html(self._tooltip.yFormat(item.value))
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
