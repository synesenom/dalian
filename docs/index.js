const documentation = require('documentation')
const ModuleParser = require('./src/module-parser')
const meta = require('../package');

// TODO List widget modules automatically

['line-chart'].forEach(async name => {
  const docs = await documentation.build([`../src/widgets/${name}.js`], {
    shallow: true
  }).then(documentation.formats.json)
    .then(JSON.parse)
  ModuleParser(meta, docs, name)
    .buildReferencePage()
    .buildExamplePage()
})
