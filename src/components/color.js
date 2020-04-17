import wong from './palettes/wong'
import deficiencyConverter from './palettes/deficiency'

// TODO Add value dependent color scheme
// TODO Add option to diverging color scheme and add default as sunset.
// TODO Add option to sequential color scheme and add default as iridescent.
// TODO Add method to convert chart to deuteranopia, tritanopia, protanopia and greyscale.

const createMapping = palette => {
  // Single color.
  if (typeof palette === 'string') {
    return () => palette
  } else if (Array.isArray(palette)) {
    // Array of colors.
    return (() => {
      let keys = []
      return key => {
        let i = keys.indexOf(key)
        return palette[i > -1 ? i : keys.push(key) - 1]
      }
    })()
  } else if (typeof palette === 'object') {
    // Exact mapping.
    return  key => palette[key]
  }
}

const convertPalette = (palette, converter) => {
  if (typeof palette === 'string') {
    return converter(palette) + ''
  } else if (Array.isArray(palette)) {
    return palette.map(converter)
  } else {
    let convertedPalette = {}
    for (let key in palette) {
      convertedPalette[key] = converter(palette[key])
    }
    return convertedPalette
  }
}

/**
 * Component implementing various color palettes and coloring policies. When this component is available for a widget,
 * its API is exposed via the {.color} namespace.
 *
 * @function Color
 */
export default (self, api) => {
  // Private members
  let _ = {
    // Variables.
    // Transformation before mapping color.
    on: d => d,

    // Raw palette (before conversion).
    palette: wong,

    // Deficiency converter.
    converter: color => color,

    // Methods.
    getMapping: () => createMapping(convertPalette(_.palette, _.converter)),

    // The actual color mapping.
    mapping: createMapping(wong)
  }

  // Protected members
  self = Object.assign(self || {}, {
    _color: {
      // Maps a group name to a color
      mapGroup: name => _.mapping(_.on(name))
    }
  })

  // Public API.
  api = Object.assign(api || {}, {
    color: {
      /**
       * Sets the color palette. Supported palettes:
       * <ul>
       *     <li><strong>Default color policy</strong>: A variant of the 8 color qualitative palette by Bang Wang. See
       *     <a href='https://www.nature.com/articles/nmeth.1618'>this paper</a> and
       *     <a href='http://mkweb.bcgsc.ca/colorblind/'>this post</a> for details.
       *     <div class='palette'>
       *       <span>Colors:</span>
       *       <div style='background-color:#333333'></div>
       *       <div style='background-color:#0072b2'></div>
       *       <div style='background-color:#56b4e9'></div>
       *       <div style='background-color:#009e73'></div>
       *       <div style='background-color:#f0e442'></div>
       *       <div style='background-color:#e69f00'></div>
       *       <div style='background-color:#d55e00'></div>
       *       <div style='background-color:#cc79a7'></div>
       *     </div></li>
       *     <li><strong>Single color</strong>: The specified color is used for all plots.</li>
       *     <li><strong>Custom color mapping</strong>>: each plot has the color specified as the value for the
       *     property with the same name as the plot's key.</li>
       * </ul>
       *
       * @method palette
       * @methodOf Color
       * @param {(string | Object)} [palette] Color palette to set. If not specified, the default policy is set. If
       * string, the same color is used for all plots. If object, it is used as a mapping from the plot names to the
       * colors.
       * @param {Function?} [on = d => d] Transformation that is used before mapping the plot to a color. The plot name is
       * passed to this method as parameters before determining the color.
       * @returns {Widget} Reference to the Widget's API.
       */
      palette (palette, on) {
        _.palette = palette || wong
        _.on = on || (d => d)

        // Update mapping.
        _.mapping = _.getMapping()
        return api
      },

      // Source: http://web.archive.org/web/20081030075157/http://www.nofunc.com/Color_Blindness_Library/
      deficiency (type) {
        // Select converter.
        _.converter = deficiencyConverter(type)

        // Update mapping.
        _.mapping = _.getMapping()
        return api
      }
    }
  })

  return { self, api }
}
