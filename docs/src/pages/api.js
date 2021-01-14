const meta = require('../utils/meta')
const compile = require('../compile')
const kebab2Pascal = require('../utils/kebab-to-pascal')
const { getModuleCategory, getModuleName } = require('../utils/path')


const ROOT = './docs/api'
const MODULES = [
  'charts/area-chart',
  'charts/bar-chart',
  'charts/box-plot',
  'charts/bubble-chart',
  'charts/bullet-chart',
  'charts/calendar-plot',
  'charts/chord-diagram',
  'charts/coxcomb-chart',
  'charts/line-chart',
  'charts/pie-chart',
  'charts/scatter-plot',
  'charts/table',
  'charts/violin-plot',
  'components/grid/base-grid',
  'components/axis/bottom-axis',
  'components/chart',
  'components/color',
  'components/description',
  'components/tooltip/element-tooltip',
  'components/font',
  'components/highlight',
  'components/label',
  'components/axis/left-axis',
  'components/line-style',
  'components/line-width',
  'components/mouse',
  'components/objects',
  'components/opacity',
  'components/pins',
  'components/placeholder',
  'components/tooltip/point-tooltip',
  'components/smoothing',
  'components/tooltip/tooltip',
  'components/trends',
  'components/widget',
  'components/grid/x-grid',
  'components/range/x-range',
  'components/grid/y-grid',
  'components/range/y-range',
  'controls/checkbox',
  'controls/legend',
  'controls/radio-button',
  'controls/slider',
  'controls/trackpad'
]


module.exports = function (name) {
  // Index page.
  console.log('Building API index')
  compile(`${ROOT}/index.pug`, `${ROOT}/index.html`, {
    modules: Object.entries(MODULES.reduce((map, d) => {
      const category = getModuleCategory(d)
      if (typeof map[category] === 'undefined') {
        map[category] = []
      }
      map[category].push({
        name: getModuleName(d),
        factory: kebab2Pascal(getModuleName(d))
      })
      return map
    }, {})).map(d => ({
      category: d[0],
      entries: d[1]
    }))
  })

  // Module pages.
  if (typeof name === 'string') {

  }
}
