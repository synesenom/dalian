import { select } from 'd3'
import styles from '../../utils/styles'
import Tooltip from './tooltip'


/**
 * Component implementing the point tooltip feature. The point tooltip is a pre-formatted tooltip that takes an array of
 * plot data and displays it in the tooltip as a list of plots with colored square markers. Can be used in widgets where
 * the tooltip displays info at a specific point of the widget (hence the name), such as line widgets or heat maps.
 * It inherits all methods from the [Tooltip]{@link ../components/tooltip.html} component. The tooltip consists of the
 * X coordinate of the current data point(s) (which can be formatted using
 * [xFormat]{@link ../components/tooltip.html#titleFormat}) and the list of Y coordinates for the plots (formatted using
 * [yFormat]{@link ../components/tooltip.html#valueFormat}).
 *
 * @function PointTooltip
 */
export default (self, api) => {
  // Default values.
  const DEFAULTS = {
    ignore: [],
    titleFormat: d => d,
    valueFormat: d => d.y
  }

  // Inherit from base tooltip
  let base = Tooltip(self, api)

  // Private members.
  let _ = {
    titleFormat: DEFAULTS.titleFormat,
    valueFormat: DEFAULTS.valueFormat,
  }

  // Protected members
  self._tooltip = Object.assign(base.self._tooltip, {
    // Variables.
    ignore: [],

    // Override methods.
    builder: content => {
      if (typeof content === 'undefined') {
        self._tooltip.content()
        return undefined
      }


      // Create content node.
      let contentNode = styles(select(document.createElement('div')), {
        display: 'table',
        padding: '10px',
        'min-width': '60px'
      })

      // Add title
      styles(contentNode.append('div'), {
        display: 'table-row',
        position: 'relative'
      }).text(_.titleFormat(content.title))

      // Add content
      const fontSize = 0.8 * parseFloat(self._font.size)
      content.content.data.forEach((plot, i) => {
        let wrapper = styles(contentNode.append('div'), {
          display: 'table-row',
          position: 'relative'
        })
        let entry = styles(wrapper.append('div'), {
          display: 'inline-block',
          position: 'relative',
          height: self._font.size,
          'margin-top': (i === 0 ? 6 : 3) + 'px'
        })
        let box = styles(entry.append('div'), {
          display: 'flex',
          position: 'relative',
          'justify-content': 'center',
          'align-items': 'center',
          height: self._font.size
        })
        styles(box.append('div'), {
          display: 'inline-block',
          position: 'relative',
          float: 'left',
          width: fontSize + 'px',
          height: fontSize + 'px',
          'margin-right': '6px',
          'border-radius': '2px',
          background: plot.background
        })
        styles(box.append('div'), {
          display: 'table-cell',
          position: 'relative',
          'max-width': '120px',
          float: 'left',
          'line-height': fontSize + 'px'
        }).html(_.valueFormat(plot))
      })

      return contentNode.node().outerHTML
    }
  })

  api.tooltip = Object.assign(api.tooltip || {}, {
    /**
     * Sets the array of keys that are ignored by the tooltip. Ignored keys are not shown in the tooltip and they don't
     * have plot markers.
     *
     * @method ignore
     * @methodOf PointTooltip
     * @param {string[]} [keys = []] Keys of plots to ignore in the tooltip.
     * @returns {Widget} Reference to the Widget API.
     */
    ignore: (keys = DEFAULTS.ignore) => {
      self._tooltip.ignore = keys
      return api
    },

    /**
     * Sets the format for the tooltip title.
     *
     * @method titleFormat
     * @methodOf PointTooltip
     * @param {Function} [format = d => d] Function to use as the formatter. May take one parameter which is the title
     * of the tooltip. Can be HTML formatted.
     * @returns {Widget} Reference to the Widget API.
     */
    titleFormat: (format = DEFAULTS.titleFormat) => {
      _.titleFormat = format
      return api
    },

    /**
     * Sets the format of the tooltip entry values.
     *
     * @method valueFormat
     * @methodOf PointTooltip
     * @param {Function} [format = d => d.y] Function to use as the formatter. May take one parameter which is the data
     * point for the current plot's entry containing the plot name and the data. Can be HTML formatted.
     * @returns {Widget} Reference to the Widget API.
     */
    valueFormat: (format = DEFAULTS.valueFormat) => {
      _.valueFormat = format
      return api
    }
  })

  return {self, api}
}
