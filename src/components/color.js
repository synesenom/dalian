import wong from './palettes/wong'
import light from './palettes/light'
import deficiencyConverter from './palettes/deficiency'

// TODO Add value dependent color scheme
// TODO Add option to diverging color scheme and add default as sunset.
// TODO Add option to sequential color scheme and add default as iridescent.

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
    return key => palette[key]
  }
}

const convertPalette = (palette, converter) => {
  // Default palette.
  if (typeof palette === 'undefined' || palette === 'palette-wong') {
    return wong.map(converter)
  }

  // Built-in palette.
  if (palette === 'palette-light') {
    return light.map(converter)
  }

  // Single color.
  if (typeof palette === 'string') {
    return converter(palette) + ''
  } else if (Array.isArray(palette)) {
    // Custom palette, arbitrary association.
    return palette.map(converter)
  } else {
    // Custom color mapping.
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
       *   <li>
       *     <strong>Default color palette</strong>: A variant of the 8 color colorblind friendly qualitative palette
       *     by Bang Wang. See <a href='https://www.nature.com/articles/nmeth.1618'>this paper</a> and
       *     <a href='http://mkweb.bcgsc.ca/colorblind/'>this post</a> for details. This color palette is also available
       *     by passing <code>palette-wong</code> to the method.
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
       *     </div>
       *   </li>
       *   <li>
       *     <strong>Built-in color palette</strong>: One of the built-in palettes that support the vast majority of
       *     color vision deficiencies:
       *     <ul>
       *       <li>
       *         <code>palette-light</code>The 9 color colorblind friendly qualitative palette designed by Paul Tol.
       *         See <a href='https://personal.sron.nl/~pault/#fig:scheme_light'>this post</a> for details.
       *         <div class='palette'>
       *           <span>Colors:</span>
       *           <div style='background-color:#77aadd'></div>
       *           <div style='background-color:#99ddff'></div>
       *           <div style='background-color:#44bb99'></div>
       *           <div style='background-color:#bbcc33'></div>
       *           <div style='background-color:#aaaa00'></div>
       *           <div style='background-color:#eedd88'></div>
       *           <div style='background-color:#ee8866'></div>
       *           <div style='background-color:#ffaabb'></div>
       *           <div style='background-color:#dddddd'></div>
       *         </div>
       *       </li>
       *     </ul>
       *   </li>
       *   <li><strong>Single color</strong>: The specified color is used for all plots.</li>
       *   <li>
       *     <strong>Custom palette</strong>: A custom color palette with arbitrary association with the plots. In this
       *     case, the colors are assigned to the plots in the order they are added/built.
       *   </li>
       *   <li>
       *     <strong>Custom color mapping</strong>: Each plot has the color specified as the value for the property with
       *     the same name as the plot's key.
       *   </li>
       * </ul>
       *
       * @method palette
       * @methodOf Color
       * @param {(string | Object)} [palette] Color palette to set. If not specified, the default policy is set. If
       * string, it's either a built-in palette or a the color represented by the string is used for all plots. If an
       * array of strings, it's colors are assigned to plots as they are added to the widget without any specific
       * association between colors and plots. If an object, it is used as a mapping from the plot names to the colors.
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

      // TODO Documentation.
      // Source: http://web.archive.org/web/20081030075157/http://www.nofunc.com/Color_Blindness_Library/
      /**
       * Emulates a color vision deficiency. Useful for testing the widget for accessibility. The deficiency emulation
       * is implemented using the algorithm
       * [here]{@link http://web.archive.org/web/20081030075157/http://www.nofunc.com/Color_Blindness_Library/}.
       *
       * @method deficiency
       * @methodOf Color
       * @param {string} type Type of deficiency to emulate. Supported values: achromatomaly, achromatopsia,
       * deuteranomaly, deuteranopia, protanomaly, protanopia, tritanomaly, tritanopia. If type is not specified, it
       * restores the true colors.
       * @returns {Widget} Reference to the Widget's API.
       */
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
