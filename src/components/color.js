import { hsl } from 'd3'

// TODO Add value dependent color scheme
const COLOR_PALETTE_DALIAN = [
  'royalblue',
  '#e41a1c',
  'yellowgreen',
  'gold',
  'orchid',
  'darkgrey',
  'darkorange',
  'sienna',
  'lightskyblue',
  'salmon',
  'palegreen',
  'palegoldenrod',
  'thistle',
  'gainsboro',
  'peachpuff',
  'tan',
  'midnightblue',
  'darkred',
  'forestgreen',
  'darkgoldenrod',
  'indigo',
  'dimgrey'
]

const createPalette = palette => {
  let keys = []
  return key => {
    let i = keys.indexOf(key)
    return palette[i > -1 ? i : keys.push(key) - 1]
  }
}

/**
 * Component implementing various color scheming features. When this component is available for a widget, its API is
 * exposed directly via the widget's own API.
 *
 * @function Color
 */
export default (self, api) => {
  // Private members
  let _ = {
    // The actual color mapping.
    mapping: createPalette(COLOR_PALETTE_DALIAN)
  }

  // Protected members
  self = Object.assign(self || {}, {
    _colors: {
      mapping: key => _.mapping(key)
    }
  })

  // Public API
  api = Object.assign(api || {}, {
    /**
     * Sets the color policy. Supported policies:
     * <ul>
     *     <li>Default color policy (no arguments): the default color scheme is used which is a modification of the
     *     qualitative color scheme Set 1 from Color Brewer.</li>
     *     <li>Single color or shades of a color (passing {string}): Either the specified color is used for all plots or
     *     a palette is generated from its shades (see {size}).</li>
     *     <li>Custom color mapping (passing an {Object}): each plot has the color specified as the value for the
     *     property with the same name as the plot's key.</li>
     * </ul>
     *
     * @method color
     * @methodOf Color
     * @param {(string | Object)} [policy] Color policy to set. If not specified, the default policy is set.
     * @param {number} [size] Number of colors that need to be generated if policy is set to a single color. If not set,
     * the color specified for {policy} is used for all plots.
     * @returns {Widget} Reference to the Widget's API.
     */
    color: (policy, size) => {
      // Update color mapping
      if (typeof policy === 'undefined') {
        // No color policy, using default
        _.mapping = createPalette(COLOR_PALETTE_DALIAN)
      } else if (typeof policy === 'string') {
        if (typeof size === 'undefined') {
          // Single color policy, using the specified color
          _.mapping = () => policy
        } else {
          // Shades of a single color
          const baseColor = hsl(policy)
          const dl = 2 * Math.min(baseColor.l, 1 - baseColor.l) / (size + 1)
          const palette = Array.from({length: size}, (d, i) => {
            let color = hsl(baseColor)
            color.l += (i - 0.5 * (size - 1)) * dl
            return color
          })
          _.mapping = createPalette(palette)
        }
      } else {
        // Color mapping given
        _.mapping = key => policy[key]
      }
      return api
    }
  })

  return { self, api }
}
