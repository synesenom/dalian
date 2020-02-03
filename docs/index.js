const documentation = require('documentation')
const ModuleParser = require('./src/module-parser')
const meta = require('../package')
const fs = require('fs')
const pug = require('pug')


const CHARTS = [{
  name: 'line-chart'
}]


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
  charts: CHARTS.map(d => ({
    name: d.name,
    factory: toFactory(d.name)
  }))
})

// Build catalogue index
buildFromTemplate('Catalogue index page', 'catalogue-index', 'catalogue/index.html', {
  dependencies,
  charts: CHARTS.map(d => {
    const script = fs.readFileSync(`catalogue/charts/${d.name}/card.html`, {encoding: 'utf8'})
    return {
      name: d.name,
      factory: toFactory(d.name),
      script
    }
  })
})

// TODO List chart modules automatically
CHARTS.map(d => d.name).forEach(async name => {
  const docs = await documentation.build([`../src/charts/${name}.js`], {
    shallow: true
  }).then(documentation.formats.json)
    .then(JSON.parse)
  ModuleParser(meta, docs, name)
    .buildReferencePage()
    .buildExamplePage()
})
