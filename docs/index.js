const documentation = require('documentation')
const ModuleParser = require('./src/module-parser')
const meta = require('../package')
const fs = require('fs')
const pug = require('pug')
const { JSDOM } = require('jsdom')


const MODULES = [
  'charts/area-chart',
  'charts/bar-chart',
  'charts/box-plot',
  'charts/bubble-chart',
  'charts/bullet-chart',
  'charts/calendar-plot',
  'charts/chord-diagram',
  'charts/coxcomb-chart',
  'charts/legend',
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
  'controls/radio-button',
  'controls/slider',
  'controls/trackpad'
]


const getModuleCategory = path => path.split('/')[0]

const getModuleName = path => path.split('/').slice(-1)[0]

const getFileSizeInBytes = path => fs.statSync(path).size

const getExamplePath = d => `catalogue/${getModuleCategory(d)}/${getModuleName(d)}/content.html`

const hasExamplePage = d => fs.existsSync(getExamplePath(d))

const kebabToCamel = moduleName => moduleName.split('-').map(d => d.charAt(0).toUpperCase() + d.substring(1)).join('')

// TODO Move this under some Doc class
function buildFromTemplate(name, templateName, outputPath, config) {
  console.log(`Building: ${name}`)
  const template = pug.compileFile(`./templates/${templateName}.pug`)
  fs.writeFileSync(outputPath, template(config));
}

function getSection (modules, section) {
  return modules.filter(d => getModuleCategory(d) === section)
    .filter(hasExamplePage)
    .map(d => {
      const content = fs.readFileSync(`catalogue/${d}/content.html`, {encoding: 'utf8'})
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

// Build root page
const dependencies = Object.entries(meta.dependencies).map(d => ({
  lib: d[0],
  version: d[1].match(/(\d+.\d+.\d+)$/)[0]
}))

buildFromTemplate('Docs index page', 'index', 'index.html', {
  gitHubBanner: fs.readFileSync('./templates/github-banner-new.html', {encoding: 'utf-8'}),

  // Download links
  download: {
    minjs: {
      url: 'dl/dalian.min.js',
      size: Math.round(getFileSizeInBytes('dl/dalian.min.js') / 1000)
    },
    gzip: {
      url: 'dl/dalian.min.js.gz',
      size: Math.round(getFileSizeInBytes('dl/dalian.min.js.gz') / 1000)
    }
  },

  // Install commands
  install: {
    node: 'dalian.min.js',
    browser: {
      dependencies: dependencies
        .map(d => `<script src="https://unpkg.com/${d.lib}@${d.version}"></script>`).join('\n'),
      module: {
        unpkg: `<script src="https://unpkg.com/${meta.name}"></script>`,
        local: `<script src="${meta.name}.min.js"></script>`
      }
    }
  }
});


// Build API root page
buildFromTemplate('API index page', 'api-index', 'api/index.html', {
  modules: Object.entries(MODULES.reduce((acc, d) => {
    const category = getModuleCategory(d)
    if (typeof acc[category] === 'undefined') {
      acc[category] = []
    }
    acc[category].push({
      name: getModuleName(d),
      factory: kebabToCamel(getModuleName(d))
    })
    return acc
  }, {})).map(d => ({
    category: d[0],
    entries: d[1]
  }))
})


// Build catalogue index
buildFromTemplate('Catalogue index page', 'catalogue', 'catalogue/index.html', {
  dependencies,
  components: MODULES.filter(d => getModuleCategory(d) === 'components')
    .filter(hasExamplePage)
    .map(d => {
      const content = fs.readFileSync(getExamplePath(d), { encoding: 'utf8' })
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
