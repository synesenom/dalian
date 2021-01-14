const { ArgumentParser } = require('argparse')
const dependencies = require('./src/utils/dependencies')
const documentation = require('documentation')
const ModuleParser = require('./src/module-parser')
const meta = require('../package')
const fs = require('fs')
const pug = require('pug')
const { JSDOM } = require('jsdom')
const buildHome = require('./src/pages/home')
const buildApi = require('./src/pages/api')
const buildTutorial = require('./src/pages/tutorial')


const parser = new ArgumentParser({
  description: 'Documentation builder'
})
parser.add_argument('-i', '--home', {
  help: 'Compile home page [off].',
  action: 'store_true'
})
parser.add_argument('-a', '--api', {
  help: 'Compile API pages [off].',
  nargs: '?'
})
parser.add_argument('-t', '--tutorial', {
  help: 'Compile tutorial pages [off].',
  nargs: '?',
  default: null
})
parser.add_argument('-d', '--docs', {
  help: 'Compile documentation [off].'
})

const args = parser.parse_args()


// Build home page.
if (args.home) {
  buildHome()
}

// Build API pages.
if (typeof args.api === 'string') {
  buildApi()
}

// Build tutorial.
buildTutorial(args.tutorial)

// Build docs
// TODO Separate API and examples.
if (typeof args.docs !== 'undefined') {
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

  const getModuleCategory = path => path.split('/')[0]

  const getModuleName = path => path.split('/').slice(-1)[0]

  const getExamplePath = d => `./docs/catalogue/${getModuleCategory(d)}/${getModuleName(d)}/content.html`

  const hasExamplePage = d => fs.existsSync(getExamplePath(d))

  const kebabToCamel = moduleName => moduleName.split('-').map(d => d.charAt(0).toUpperCase() + d.substring(1)).join('')

  // TODO Move this under some Doc class
  // eslint-disable-next-line no-inner-declarations
  function buildFromTemplate(name, templateName, outputPath, config) {
    console.log(`Building: ${name}`)
    const template = pug.compileFile(`./docs/templates/${templateName}.pug`)
    fs.writeFileSync(outputPath, template(config));
  }

  // eslint-disable-next-line no-inner-declarations
  function getSection(modules, section) {
    return modules.filter(d => getModuleCategory(d) === section)
      .filter(hasExamplePage)
      .map(d => {
        const content = fs.readFileSync(`./docs/catalogue/${d}/content.html`, {encoding: 'utf8'})
        const document = new JSDOM(content).window.document
        const script = document.getElementsByClassName('card-example')[0].outerHTML
        return {
          category: getModuleCategory(d),
          name: getModuleName(d),
          factory: kebabToCamel(getModuleName(d)),
          script
        }
      })
  }

// Build catalogue index
  buildFromTemplate('Catalogue index page', 'catalogue', './docs/catalogue/index.html', {
    dependencies,
    components: MODULES.filter(d => getModuleCategory(d) === 'components')
      .filter(hasExamplePage)
      .map(d => {
        const content = fs.readFileSync(getExamplePath(d), {encoding: 'utf8'})
        const document = new JSDOM(content).window.document
        const script = document.getElementsByClassName('card-example')[0].outerHTML
        return {
          category: getModuleCategory(d),
          name: getModuleName(d),
          factory: kebabToCamel(getModuleName(d)),
          script
        }
      }),
    controls: getSection(MODULES, 'controls'),
    charts: getSection(MODULES, 'charts')
  })

  MODULES.forEach(async d => {
    const docs = await documentation.build([`../src/${d}.js`], {
      shallow: true
    }).then(documentation.formats.json)
      .then(JSON.parse)

    // Build API reference and example pages.
    const parser = ModuleParser(meta, docs, d)
      .buildReferencePage()

    // TODO Move catalogue path checking to ModuleParser.
    if (hasExamplePage(d)) {
      parser.buildExamplePage()
    }
  })
}
