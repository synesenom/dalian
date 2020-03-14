const documentation = require('documentation')
const ModuleParser = require('./src/module-parser')
const meta = require('../package')
const fs = require('fs')
const pug = require('pug')
const { JSDOM } = require('jsdom')


const COMPONENTS = [
  'pin',
  'trend',
  'tooltip/tooltip',
  'tooltip/point-tooltip',
  'tooltip/element-tooltip'
]

const CHARTS = [
  'area-chart',
  'bar-chart',
  'line-chart'
]


function getFileSizeInBytes(path) {
  const stats = fs.statSync(path)
  return stats.size
}

function toFactory(name) {
  return name.split('-').map(d => d.charAt(0).toUpperCase() + d.substring(1)).join('');
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
  components: COMPONENTS.map(d => ({
    name: d.split('/').slice(-1)[0],
    factory: toFactory(d.split('/').slice(-1)[0])
  })),
  charts: CHARTS.map(d => ({
    name: d,
    factory: toFactory(d)
  }))
})

// Build catalogue index
buildFromTemplate('Catalogue index page', 'catalogue-index', 'catalogue/index.html', {
  dependencies,
  charts: CHARTS.map(d => {
    const content = fs.readFileSync(`catalogue/charts/${d}/content.html`, {encoding: 'utf8'})
    const document = new JSDOM(content).window.document
    const script = document.getElementsByClassName('card-example')[0].outerHTML
    return {
      name: d,
      factory: toFactory(d),
      script
    }
  })
})

// TODO List chart modules automatically
COMPONENTS.forEach(async d => {
  const docs = await documentation.build([`../src/components/${d}.js`], {
    shallow: true
  }).then(documentation.formats.json)
    .then(JSON.parse)
  ModuleParser(meta, docs, d)
    .buildReferencePage('component')
})

CHARTS.forEach(async d => {
  const docs = await documentation.build([`../src/charts/${d}.js`], {
    shallow: true
  }).then(documentation.formats.json)
    .then(JSON.parse)
  ModuleParser(meta, docs, d)
    .buildReferencePage('chart')
    .buildExamplePage()
})
