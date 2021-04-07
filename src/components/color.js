import { interpolateRgb, piecewise } from 'd3'
import wong from './palettes/wong'
import bright from './palettes/bright'
import muted from './palettes/muted'
import light from './palettes/light'
import vibrant from './palettes/vibrant'
import sunset from './palettes/sunset'
import iridescent from './palettes/iridescent'
import deficiencyConverter from './palettes/deficiency'

const POLICIES = {
  categorical: 'categorical',
  sequential: 'sequential',
  diverging: 'diverging'
}

// TODO Fallback to group color and currentColor if _.on is not set.
// TODO Clean up module.
// TODO Docstring.
function selectDefaultPalette (policy) {
  switch (policy) {
    default:
    case POLICIES.categorical:
      return wong
    case POLICIES.sequential:
      return iridescent.colors
    case POLICIES.diverging:
      return sunset.colors
  }
}

// TODO Docstring.
function selectDefaultMissingColor (policy) {
  switch (policy) {
    default:
    case POLICIES.categorical:
      return '#fff'
    case POLICIES.sequential:
      return iridescent.missing
    case POLICIES.diverging:
      return sunset.missing
  }
}

// TODO Docstring.
function applyDeficiency (palette, converter) {
  // Single color.
  if (typeof palette === 'string') {
    return converter(palette) + ''
  } else if (Array.isArray(palette)) {
    // Array of colors.
    return palette.map(converter)
  } else {
    // Color mapping (object).
    const convertedPalette = {}
    for (const key in palette) {
      if (Object.prototype.hasOwnProperty.call(palette, key)) {
        convertedPalette[key] = converter(palette[key])
      }
    }
    return convertedPalette
  }
}

// TODO Docstring.
function createCategoricalMapping (palette, missing, on) {
  // Single color.
  if (typeof palette === 'string') {
    return () => palette
  } else if (Array.isArray(palette)) {
    // Array of colors.
    return (() => {
      const keys = []
      return d => {
        const value = on(d)
        if (value === null) {
          return missing
        } else {
          const i = keys.indexOf(value)
          return palette[i > -1 ? i : keys.push(value) - 1]
        }
      }
    })()
  } else if (typeof palette === 'object') {
    // Exact mapping.
    return d => {
      const value = on(d)
      return value === null ? missing : palette[value]
    }
  }
}

// TODO Docstring.
function createSequentialMapping (palette, missing, on) {
  if (typeof palette !== 'string' && !Array.isArray(palette)) {
    // Any other case: warning and set to default palette.
    console.warn(`Palette type (${typeof palette}) is incompatible with ${POLICIES.sequential} color policy, fallback to default color palette.`)
    palette = selectDefaultPalette(POLICIES.sequential)
  }

  // String: map [0, 1] to [white, color].
  if (typeof palette === 'string') {
    const i = interpolateRgb('#fff', palette)
    return d => {
      const value = on(d)
      return value === null ? missing : i(value)
    }
  } else if (Array.isArray(palette)) {
    // Array: interpolate within array.
    const i = piecewise(interpolateRgb.gamma(2.2), palette)
    return d => {
      const value = on(d)
      return value === null ? missing : i(value)
    }
  }
}

// TODO Docstring.
function createDivergingMapping (palette, missing, on) {
  if (!Array.isArray(palette)) {
    // Incompatible palette: warning and set to default palette.
    console.warn(`Palette type (${typeof palette}) is incompatible with ${POLICIES.diverging} color policy, fallback to default color palette.`)
    palette = selectDefaultPalette(POLICIES.diverging)
  }

  // Array: interpolate within array.
  const i = piecewise(interpolateRgb.gamma(2.2), palette)
  return d => {
    const value = on(d)
    return i((value + 1) / 2)
  }
}

/**
 * Component implementing various color palettes and coloring policies. When this component is available for a widget,
 * its API is exposed via the {.color} namespace.
 *
 * @function Color
 */
export default (self, api) => {
  // Default values.
  const DEFAULTS = {
    policy: POLICIES.categorical,
    on: d => d.name
  }

  // Private members.
  const _ = {
    // Coloring policy: categorical, sequential, diverging.
    policy: DEFAULTS.policy,

    // Palette: single color, array of colors or a mapping itself.
    palette: selectDefaultPalette(DEFAULTS.policy),

    // Color to indicate missing data.
    missing: selectDefaultMissingColor(DEFAULTS.policy),

    // Color vision deficiency filter.
    deficiency: undefined,

    // Mapper from data to color.
    on: DEFAULTS.on,

    // Scale function that should be updated internally by the widget.
    scale: d => d,

    // Builds the mapper.
    buildMapper () {
      // Select palette.
      const originalPalette = _.palette || selectDefaultPalette(_.policy)

      // Convert palette according to the current deficiency.
      const mappedPalette = applyDeficiency(originalPalette, deficiencyConverter(_.deficiency))

      // Build accessor.
      const accessor = d => {
        const value = _.on(d)
        return value === null ? null : _.scale(value)
      }

      // Create mapper function.
      switch (_.policy) {
        default:
        case POLICIES.categorical:
          return createCategoricalMapping(mappedPalette, _.missing, accessor)
        case POLICIES.sequential:
          return createSequentialMapping(mappedPalette, _.missing, accessor)
        case POLICIES.diverging:
          return createDivergingMapping(mappedPalette, _.missing, accessor)
      }
    }
  }

  // Protected members.
  self = Object.assign(self || {}, {
    _color: {
      init (policy, on) {
        // Set policy and accessor.
        _.policy = policy
        _.on = on

        // Set default palette and missing color.
        _.palette = selectDefaultPalette(policy)
        _.missing = selectDefaultMissingColor(policy)

        // Build mapper.
        self._color.mapper = _.buildMapper()
      },

      scale (scale) {
        _.scale = scale
        self._color.mapper = _.buildMapper()
      },

      mapper: _.buildMapper()
    }
  })

  // Public API.
  api = Object.assign(api || {}, {
    color: {
      /**
       * Sets the color scheme policy and updates the current color mapping. The following policies are supported:
       * <ul>
       *   <li><code>categorical</code>: Maps categories to colors, typically different plots in a chart or groups of
       *   elements in a widget. Supported palette types: single color (all elements have the same color), array of
       *   colors (incoming elements in a widget will be assigned colors in order), object representing the
       *   color mapping (with element name - color as property names and values). The default color palette is the one
       *   proposed by Bang Wong (See <a href='https://www.nature.com/articles/nmeth.1618'>this paper</a> and
       *   <a href='http://mkweb.bcgsc.ca/colorblind/'>this post</a> for details):
       *   <div class='palette'>
       *     <span>Colors:</span>
       *     <div style='background-color:#333333'></div>
       *     <div style='background-color:#0072b2'></div>
       *     <div style='background-color:#56b4e9'></div>
       *     <div style='background-color:#009e73'></div>
       *     <div style='background-color:#f0e442'></div>
       *     <div style='background-color:#e69f00'></div>
       *     <div style='background-color:#d55e00'></div>
       *     <div style='background-color:#cc79a7'></div>
       *   </div>
       *   </li>
       *   <li><code>sequential</code>: Maps the interval [0, 1] to a range of colors. When this policy is used,
       *   it is most often applied together with a specific mapping function set by the <code>on</code> method.
       *   Supported palette types: single color (colors are interpolated from white to the specified color),
       *   array of colors (colors are interpolated according to the specified colors).
       *   The default color palette is the iridescent palette created by Paul Tol (See
       *   <a href='https://personal.sron.nl/~pault/#sec:sequential'>this post</a> for details):
       *   <div class='palette'>
       *     <span>Colors:</span>
       *     <div style='background-color:#fefbe9'></div>
       *     <div style='background-color:#fcf7d5'></div>
       *     <div style='background-color:#f5f3c1'></div>
       *     <div style='background-color:#eaf0b5'></div>
       *     <div style='background-color:#ddecbf'></div>
       *     <div style='background-color:#d0e7ca'></div>
       *     <div style='background-color:#c2e3d2'></div>
       *     <div style='background-color:#b5ddd8'></div>
       *     <div style='background-color:#a8d8dc'></div>
       *     <div style='background-color:#9bd2e1'></div>
       *     <div style='background-color:#8dcbe4'></div>
       *     <div style='background-color:#81c4e7'></div>
       *     <div style='background-color:#7bbce7'></div>
       *     <div style='background-color:#7eb2e4'></div>
       *     <div style='background-color:#88a5dd'></div>
       *     <div style='background-color:#9398d2'></div>
       *     <div style='background-color:#9b8ac4'></div>
       *     <div style='background-color:#9d7db2'></div>
       *     <div style='background-color:#9a709e'></div>
       *     <div style='background-color:#906388'></div>
       *     <div style='background-color:#805770'></div>
       *     <div style='background-color:#684957'></div>
       *     <div style='background-color:#46353a'></div>
       *   </div>
       *   </li>
       *   <li><code>diverging</code>: Maps the interval [-1, 1] to a range of colors.
       *   When this policy is used, it is most often applied together with a specific mapping function set by the
       *   <code>on</code> method. Supported palette types: array of colors (colors are interpolated according to the
       *   specified colors). The default palette is the sunset palette
       *   created by Paul Tol which is a variant of the diverging color palette RdYlBu from Cynthia Brewer (See
       *   <a href='https://personal.sron.nl/~pault/#fig:scheme_sunset'>this post</a> and
       *   <a href='https://colorbrewer2.org/#type=diverging&scheme=RdYlBu&n=11'>the original</a> scheme for details):
       *   <div class='palette'>
       *     <span>Colors:</span>
       *     <div style='background-color:#364b9a'></div>
       *     <div style='background-color:#4a7bb7'></div>
       *     <div style='background-color:#6ea6cd'></div>
       *     <div style='background-color:#98cae1'></div>
       *     <div style='background-color:#c2e4ef'></div>
       *     <div style='background-color:#eaeccc'></div>
       *     <div style='background-color:#feda8b'></div>
       *     <div style='background-color:#fdb366'></div>
       *     <div style='background-color:#f67e4b'></div>
       *     <div style='background-color:#dd3d2d'></div>
       *     <div style='background-color:#a50026'></div>
       *   </div>
       *   </li>
       * </ul>
       *
       * @method policy
       * @memberOf Color
       * @param {string} [policy = categorical] Policy to set for the color scheme.
       * @returns {Widget} Reference to the Widget's API.
       * @example
       *
       * // Set color policy to sequential.
       * chart.color.policy('sequential')
       *
       * // Reset color policy to default.
       * chart.color.policy()
       */
      policy (policy = DEFAULTS.policy) {
        _.policy = policy
        self._color.mapper = _.buildMapper()
        return api
      },

      /**
       * Sets the color palette. Supported palettes:
       * <ul>
       *   <li>
       *     <strong>Default color palette</strong>: When the palette is not specified or it is incompatible with the
       *     currently set policy, the policy dependent default palette is used. See the documentation of the policy
       *     method for details.
       *   </li>
       *   <li>
       *     <strong>Built-in color palette</strong> (passing a <code>string</code> that starts with 'palette-'): One of
       *     the built-in palettes that support the vast majority of color vision deficiencies:
       *     <ul>
       *       <li>
       *         <code>palette-bright</code>A 6 color colorblind friendly qualitative <a href='https://personal.sron.nl/~pault/#fig:scheme_bright'>palette</a> designed by Paul Tol.
       *         <div class='palette'>
       *           <span>Colors:</span>
       *           <div style='background-color:#4477aa'></div>
       *           <div style='background-color:#ee6677'></div>
       *           <div style='background-color:#228833'></div>
       *           <div style='background-color:#ccbb44'></div>
       *           <div style='background-color:#66ccee'></div>
       *           <div style='background-color:#aa3377'></div>
       *           <div style='background-color:#bbbbbb'></div>
       *         </div>
       *       </li>
       *       <li>
       *         <code>palette-muted</code>A 9 color colorblind friendly qualitative <a href='https://personal.sron.nl/~pault/#fig:scheme_muted'>palette</a> designed by Paul Tol.
       *         <div class='palette'>
       *           <span>Colors:</span>
       *           <div style='background-color:#332288'></div>
       *           <div style='background-color:#88ccee'></div>
       *           <div style='background-color:#44aa99'></div>
       *           <div style='background-color:#117733'></div>
       *           <div style='background-color:#999933'></div>
       *           <div style='background-color:#ddcc77'></div>
       *           <div style='background-color:#cc6677'></div>
       *           <div style='background-color:#882255'></div>
       *           <div style='background-color:#aa4499'></div>
       *           <div style='background-color:#dddddd'></div>
       *         </div>
       *       </li>
       *       <li>
       *         <code>palette-light</code>A 8 color colorblind friendly qualitative <a href='https://personal.sron.nl/~pault/#fig:scheme_light'>palette</a> designed by Paul Tol.
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
       *       <li>
       *         <code>palette-vibrant</code>A 6 color colorblind friendly qualitative <a href='https://personal.sron.nl/~pault/#fig:scheme_vibrant'>palette</a> designed by Paul Tol.
       *         <div class='palette'>
       *           <span>Colors:</span>
       *           <div style='background-color:#ee7733'></div>
       *           <div style='background-color:#0077bb'></div>
       *           <div style='background-color:#33bbee'></div>
       *           <div style='background-color:#ee3377'></div>
       *           <div style='background-color:#cc3311'></div>
       *           <div style='background-color:#009988'></div>
       *           <div style='background-color:#bbbbbb'></div>
       *         </div>
       *       </li>
       *     </ul>
       *   </li>
       *   <li>
       *     <strong>Single color</strong> (passing a <code>string</code> that represents a color): The specified color
       *     is used for all plots (categorical policy) or shades of the color are used (sequential policy).
       *   </li>
       *   <li>
       *     <strong>List of colors</strong> (passing <code>string[]</code>): A custom color palette. It is either
       *     used to color elements in the order they appear in a widget (categorical policy) or colors are interpolated
       *     in the specified order (sequential and diverging policies).
       *   </li>
       *   <li>
       *     <strong>Custom color mapping</strong> (passing an <code>object</code>): Each plot has the color specified
       *     as the value for the property with the same name as the plot's key.
       *   </li>
       * </ul>
       *
       * @method palette
       * @memberOf Color
       * @param {(string | string[] | Object)} palette Color palette to set. If not specified, the
       * default policy is set. If string, it's either a built-in palette or a the color represented by the string is
       * used for all plots. If an array of strings, it's colors are assigned to plots as they are added to the widget
       * without any specific association between colors and plots. If an object, it is used as a mapping from the plot
       * names to the colors.
       * @param {string} missing Color to be used for missing values. This is mostly relevant for the sequential and
       * diverging color policies. Default value is policy dependent.
       * @returns {Widget} Reference to the Widget's API.
       * @example
       *
       * // Set color palette to single color.
       * chart.color.palette('green')
       *
       * // Set color palette to a mapping from plot names to colors (categorical policy).
       * chart.color.palette({
       *   plot1: 'green',
       *   plot2: 'brown'
       * })
       *
       * // Set color palette to an array of colors with missing color as gray
       * // for sequential and diverging policies.
       * chart.color.palette(['green', 'yellow', 'brown'], 'gray')
       *
       * // Reset color palette to policy-default.
       * chart.color.palette()
       */
      palette (palette, missing) {
        // Check fo built-in palettes
        if (typeof palette === 'string' && palette.startsWith('palette-')) {
          switch (palette) {
            case 'palette-bright':
              _.palette = bright
              break
            case 'palette-vibrant':
              _.palette = vibrant
              break
            case 'palette-wong':
              _.palette = wong
              break
            case 'palette-light':
              _.palette = light
              break
            case 'palette-muted':
              _.palette = muted
              break
            case 'palette-sunset':
              _.palette = sunset.colors
              break
            case 'palette-iridescent':
              _.palette = iridescent.colors
              break
          }
        } else {
          _.palette = palette
        }

        // Set missing value color.
        _.missing = missing || '#fff'

        // Update mapping.
        self._color.mapper = _.buildMapper()
        return api
      },

      /**
       * Emulates a color vision deficiency. Useful for testing the widget for accessibility. The deficiency emulation
       * is implemented using the algorithm
       * [here]{@link http://web.archive.org/web/20081030075157/http://www.nofunc.com/Color_Blindness_Library/}.
       *
       * @method deficiency
       * @memberOf Color
       * @param {string} type Type of deficiency to emulate. Supported values: <code>achromatomaly</code>,
       * <code>achromatopsia</code>, <code>deuteranomaly</code>, <code>deuteranopia</code>, <code>protanomaly</code>,
       * <code>protanopia</code>, <code>tritanomaly</code>, <code>tritanopia</code>. If it is not specified, true colors
       * are restored.
       * @returns {Widget} Reference to the Widget's API.
       * @example
       *
       * // Set deficiency to protanotopia.
       * chart.color.deficiency('protanotopia')
       *
       * // Remove deficiency emulator (true colors).
       * chart.color.deficiency()
       */
      deficiency (type) {
        _.deficiency = type
        self._color.mapper = _.buildMapper()
        return api
      },

      /**
       * Sets the mapping function that should be used to map data points to colors. It is used different ways for each
       * coloring policy:
       * <ul>
       *   <li><strong>Categorical</strong>: the function should map to distinct categorical values (such as integers or
       *   strings).</li>
       *   <li><strong>Sequential</strong>: the function should map to the interval [0, 1].<li>
       *   <li><strong>Diverging</strong>: the function should map to the interval [-1, 1].<li>
       * </ul>
       *
       * @method on
       * @memberOf Color
       * @param {Function} [on = d => d.name] Function that maps from a data point to a set of categories, the interval
       * [0, 1] or the interval [-1, 1].
       * @returns {Widget} Reference to the Widget's API.
       * @example
       *
       * // Set color mapping to the first letter of the plot name (for categorical policy).
       * chart.color.on(d => d.name.chartAt(0))
       *
       * // Set color mapping to the y value of the element (for sequential policy).
       * // yMax is the maximum data point in the data set.
       * chart.color.on(d => d.y / yMax)
       *
       * // Reset color mapping to default.
       * chart.color.on()
       */
      on (on = DEFAULTS.on) {
        _.on = on
        self._color.mapper = _.buildMapper()
        return api
      },

      getMapper: () => _.buildMapper()
    }
  })

  return { self, api }
}
