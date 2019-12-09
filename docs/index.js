const documentation = require('documentation')
const ModuleParser = require('./src/module-parser')
const ArgumentParser = require('argparse').ArgumentParser
const version = require('./package').version


const build = async (category, name) => {
  console.log(`Building docs for: ${category}/${name}`)
  const config = {
    srcPath: `../modules/${category}s/${name}/src/index.js`,
    metaPath: `../../modules/${category}s/${name}/package.json`
  }

  // Build documentation content
  documentation.build([config.srcPath], {
    shallow: true
  }).then(documentation.formats.json)
    .then(docs => {
      // Parse docs and build pages
      ModuleParser(JSON.parse(docs), config)
        .buildReferencePage('reference')
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
    help: 'Module category. Supported categories: widget.'
  }
)
parser.addArgument(
  ['-m', '--module'], {
    help: 'Module name.'
  }
);

['line-chart'].forEach(m => {
  build('widget', m)
})
