const documentation = require('documentation')
const ModuleParser = require('./src/module-parser')
const meta = require('../package')
const fs = require('fs')
const pug = require('pug')
const { JSDOM } = require('jsdom')


const MODULES = [
  'components/axis/bottom-axis',
  'components/axis/left-axis',
  'components/chart',
  'components/color',
  'components/description',
  'components/font',
  'components/grid/base-grid',
  'components/grid/x-grid',
  'components/grid/y-grid',
  'components/mouse',
  'components/opacity',
  'components/pin',
  'components/placeholder',
  'components/range/x-range',
  'components/range/y-range',
  'components/trend',
  'components/tooltip/tooltip',
  'components/tooltip/point-tooltip',
  'components/tooltip/element-tooltip',
  'components/widget',
  'widgets/area-chart',
  'widgets/bar-chart',
  'widgets/line-chart',
  'widgets/scatter-plot'
]
const MODULES_2 = [
  'components/axis/bottom-axis',
  'components/axis/left-axis',
  'widgets/area-chart',
  'widgets/bar-chart',
  'widgets/line-chart',
  'widgets/scatter-plot'
]



function getModuleCategory (path) {
  return path.split('/')[0]
}

function getModuleName (path) {
  return path.split('/').slice(-1)[0]
}

function getFileSizeInBytes(path) {
  const stats = fs.statSync(path)
  return stats.size
}

function kebabToCamel(moduleName) {
  return moduleName.split('-').map(d => d.charAt(0).toUpperCase() + d.substring(1)).join('')
}

// Build root page
const dependencies = Object.entries(meta.dependencies).map(d => ({
  lib: d[0],
  version: d[1].match(/(\d+.\d+.\d+)$/)[0]
}))
buildFromTemplate('Docs index page', 'index', 'index.html', {
  gitHubBanner: fs.readFileSync('./templates/github-banner.html', {encoding: 'utf-8'}),

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
    node: `dalian.min.js`,
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

// TODO Move this under some Doc class
function buildFromTemplate(name, templateName, outputPath, config) {
  console.log(`Building: ${name}`)
  const template = pug.compileFile(`./templates/${templateName}.pug`)
  fs.writeFileSync(outputPath, template(config));
}


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
buildFromTemplate('Catalogue index page', 'catalogue-index', 'catalogue/index.html', {
  dependencies,
  components: MODULES_2.filter(d => getModuleCategory(d) === 'components').map(d => {
    const content = fs.readFileSync(`catalogue/${getModuleCategory(d)}/${getModuleName(d)}/content.html`, {encoding: 'utf8'})
    const document = new JSDOM(content).window.document
    const script = document.getElementsByClassName('card-example')[0].outerHTML
    return {
      category: getModuleCategory(d),
      name: getModuleName(d),
      factory: kebabToCamel(getModuleName(d)),
      script
    }
  }),
  widgets: MODULES_2.filter(d => getModuleCategory(d) === 'widgets').map(d => {
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
})

MODULES_2.forEach(async d => {
  const docs = await documentation.build([`../src/${d}.js`], {
    shallow: true
  }).then(documentation.formats.json)
    .then(JSON.parse)

  // Build API reference and example pages.
  ModuleParser(meta, docs, d)
    .buildReferencePage()
    .buildExamplePage()
})
