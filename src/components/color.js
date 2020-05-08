import wong from './palettes/wong'
import light from './palettes/light'
import sunset from './palettes/sunset'
import iridescent from './palettes/iridescent'
import deficiencyConverter from './palettes/deficiency'

// TODO Add value dependent color scheme
// TODO Add option to diverging color scheme and add default as sunset.
// TODO Add option to sequential color scheme and add default as iridescent.
// TODO Fallback to group color and currentColor if _.on is not set.
function buildMapper (policy = 'categorical',
                      palette = wong,
                      deficiency = null,
                      on = d => d.name) {
  // Select palette.
  const originalPalette = palette || selectDefaultPalette(policy)

  // Convert palette according to the current deficiency.
  const mappedPalette = applyDeficiency(originalPalette, deficiencyConverter(deficiency))

  // Create mapper function.
  switch (policy) {
    default:
    case 'categorical':
      return createCategoricalMapping(mappedPalette, on)
  }
  // TODO Categorical: string - return constant, array - map consecutively, object - map object
  // TODO Sequential: string - use shades of color, array - interpolate, object - error!
  // TODO Diverging: string - error!, array - interpolate, object - error!
}

function selectDefaultPalette (policy) {
  switch (policy) {
    default:
    case 'categorical':
      return wong
    case 'sequential':
      return sunset
    case 'diverging':
      return iridescent
  }
}

function applyDeficiency (palette, converter) {
  // Single color.
  if (typeof palette === 'string') {
    return converter(palette) + ''
  } else if (Array.isArray(palette)) {
    // Array of colors.
    return palette.map(converter)
  } else {
    // Color mapping (object).
    let convertedPalette = {}
    for (let key in palette) {
      convertedPalette[key] = converter(palette[key])
    }
    return convertedPalette
  }
}

function createCategoricalMapping (palette, on) {
  // Single color.
  if (typeof palette === 'string') {
    return () => palette
  } else if (Array.isArray(palette)) {
    // Array of colors.
    return (() => {
      let keys = []
      return value => {
        let key = on(value)
        let i = keys.indexOf(key)
        return palette[i > -1 ? i : keys.push(key) - 1]
      }
    })()
  } else if (typeof palette === 'object') {
    // Exact mapping.
    return value => palette[on(value)]
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
    // Coloring policy: categorical, sequential, diverging.
    policy: 'categorical',
    palette: undefined,
    deficiency: null,
    on: d => d.name,
  }

  // Protected members
  self = Object.assign(self || {}, {
    _color: {
      mapper: buildMapper()
    }
  })

  // Public API.
  api = Object.assign(api || {}, {
    color: {
      policy (policy = 'categorical') {
        _.policy = policy
        return api
      },

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
       * @param {(string | string[] | Object)} [palette] Color palette to set. If not specified, the default policy is set. If
       * string, it's either a built-in palette or a the color represented by the string is used for all plots. If an
       * array of strings, it's colors are assigned to plots as they are added to the widget without any specific
       * association between colors and plots. If an object, it is used as a mapping from the plot names to the colors.
       * passed to this method as parameters before determining the color.
       * @returns {Widget} Reference to the Widget's API.
       */
      palette (palette) {
        // Check fo built-in palettes
        if (typeof palette === 'string' && palette.startsWith('palette-')) {
          switch (palette) {
            case 'palette-wong':
              _.palette = wong
              break
            case 'palette-light':
              _.palette = light
              break
            case 'palette-sunset':
              _.palette = sunset
              break
            case 'palette-iridescent':
              _.palette = iridescent
              break
          }
        } else {
          _.palette = palette
        }

        // Update mapping.
        self._color.mapper = buildMapper('categorical', _.palette, _.deficiency)
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
        _.deficiency = type || null

        // Update mapping.
        self._color.mapper = buildMapper('categorical', _.palette, _.deficiency)
        return api
      }
    }
  })

  return { self, api }
}
