const documentation = require('documentation')
const ModuleParser = require('./src/module-parser')
const ArgumentParser = require('argparse').ArgumentParser
const version = require('./package').version


const build = async (category, name) => {
  console.log(`Building docs for: ${category}/${name}...`)
  const SRC_DIR = '../modules'
  const dir = `${SRC_DIR}/${category}s/${name}`

  // Read package.json
  let meta = require(`${dir}/package`)

  // Build documentation content
  documentation.build([`../modules/${category}s/${name}/src/index.js`], {
    shallow: true
  }).then(documentation.formats.json)
    .then(docs => {
      // Parse docs and build pages
      ModuleParser(JSON.parse(docs), meta)
        //.buildReferencePage('reference')
        // TODO .buildDemoPage('demo')
        .buildExamplePage('examples')
    })
}

const parser = new ArgumentParser({
  version,
  addHelp: true,
  description: 'Documentation generator for dalian.'
})
parser.addArgument(
  ['-c', '--category'], {
    help: 'Module category. Supported categories: component, widget.'
  }
)
parser.addArgument(
  ['-m', '--module'], {
    help: 'Module name.'
  }
)

build('widget', 'line-chart')
