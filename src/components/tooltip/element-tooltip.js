import { select } from 'd3'
import styles from '../../utils/styles'
import BaseTooltip from './tooltip'

/**
 * Component implementing the element tooltip feature. The element tooltip is a pre-formatted tooltip that takes a
 * data point and displays its attributes in the tooltip with a colored left border. The name of the plot group the
 * element belongs to is used as the tooltip title and the various attributes are displayed in a column of entries. Each
 * entry is a label-value pair.
 * The element tooltip can be used in widgets where the tooltip displays info for a specific element in the widget
 * (hence the name), such as bar widgets or pie widgets. It inherits all methods from the
 * <a href="../components/tooltip.html">Tooltip</a> component.
 *
 * @function ElementTooltip
 */
export default (self, api) => {
  // Inherit from base tooltip
  let base = BaseTooltip(self, api)

  // Private members.
  let _ = {
    titleFormat: x => x,
    labelFormat: x => (x + ':'),
    valueFormat: x => x
  }

  // Protected members
  self._tooltip = Object.assign(base.self._tooltip, {
    // Override methods
    builder: content => {
      if (typeof content === 'undefined') {
        self._tooltip.content()
        return undefined
      }

      // Create content node
      let contentNode = styles(select(document.createElement('div')), {
        'border-radius': '2px',
        padding: 0.7 * parseFloat(self._font.size) + 'px',
        'font-family': 'inherit',
        'border-left': content.stripe ? 'solid 4px ' + content.stripe : null
      })

      // Add title
      styles(contentNode.append('div'), {
        position: 'relative',
        width: 'calc(100% - 10px)',
        'line-height': parseFloat(self._font.size) + 'px',
        margin: '2px',
        'margin-bottom': '10px'
      }).html(_.titleFormat(content.title))

      // Add content
      content.content.data.forEach(item => {
          let entry = styles(contentNode.append('div'), {
            position: 'relative',
            height: 0.9 * parseFloat(self._font.size) + 'px',
            margin: '2px',
            'padding-right': '10px',
            'line-height': self._font.size
          })
          styles(entry.append('div'), {
            position: 'relative',
            float: 'left',
            'margin-right': '10px'
          }).html(_.labelFormat(item.name))
          styles(entry.append('span'), {
            position: 'relative',
            float: 'right'
          }).html(_.valueFormat(item.value, item.name))
        })

      return contentNode.node().outerHTML
    }
  })

  api.tooltip = Object.assign(api.tooltip || {}, {
    /**
     * Sets the format for the tooltip title.
     *
     * @method titleFormat
     * @methodOf ElementTooltip
     * @param {Function} [format = x => x] Function to use as the formatter. May take one parameter which is the title
     * of the tooltip. Can be HTML formatted.
     * @returns {Widget} Reference to the Widget API.
     */
    titleFormat: format => {
      _.titleFormat = format || (x => x)
      return api
    },

    /**
     * Sets the format for the tooltip entry labels.
     *
     * @method labelFormat
     * @methodOf ElementTooltip
     * @param {Function} [format = x => x + ':'] Function to use as the formatter. May take one parameter which is the
     * entry label. Can be HTML formatted.
     * @returns {Widget} Reference to the Widget API.
     */
    labelFormat: format => {
      _.labelFormat = format || (x => (x + ':'))
      return api
    },

    /**
     * Sets the format for the tooltip entry values.
     *
     * @method valueFormat
     * @methodOf ElementTooltip
     * @param {Function} [format = x => x] Function to use as the formatter. May take one parameter which is the
     * entry value. Can be HTML formatted.
     * @returns {Widget} Reference to the Widget API.
     */
    valueFormat: format => {
      _.valueFormat = format || (x => x)
      return api
    },
  })

  return {self, api}
}
