const fs = require('fs')
const BlockParser = require('./block-parser')
const pug = require('pug')
const sass = require('node-sass')

const createDir = path => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
  }
}

const createPath = path => {
  let dirs = path.split('/')
  dirs.reduce((current, dir) => {
    current += '/' + dir
    createDir(current)
    return current
  }, '.')
}


module.exports = (docs, config) => {
  // Read package.json
  const meta = require(config.metaPath)

  // Naming
  const libraryName = meta.name.split('/')[0].slice(1)
  const packageName = meta.name.split('/')[1]
  const category = packageName.split('-')[0]
  const moduleName = packageName.split('-').slice(1).join('-')
  const factoryName = moduleName.split('-').map(d => d[0].toUpperCase() + d.slice(1)).join('')

  // Parse documentation blocks and sort them alphabetically
  let blocks = docs.map(BlockParser)
    .sort((a, b) => a.id() === factoryName ? -1 : a.id().localeCompare(b.id()))

  let api = {
    buildReferencePage: outputDir => {
      console.log('  API reference page')
      const path = `${outputDir}/${category}s/${moduleName}`
      createPath(path)

      // Build template
      const template = pug.compileFile('./templates/reference.pug')
      fs.writeFileSync(`${path}/index.html`, template({
        gitHubBanner: fs.readFileSync('./templates/github-banner.html', {encoding: 'utf-8'}),
        install: {
          node: `@${libraryName}/${packageName}`
        },
        content: {
          title: `${moduleName} | ${libraryName}`,
          heading: factoryName,
          description: meta.description,
          menu: blocks.map(d => d.id()),
          reference: blocks.map(d => {
            return {
              id: d.id(),
              signature: `${factoryName}.${d.signature()}`,
              description: d.description(),
              params: d.params(),
              returns: d.returns()
            }
          }),
          example: `synesenom.github.io/${libraryName}/examples/${category}s/${moduleName}`
        }
      }))
      return api
    },

    buildExamplePage: outputDir => {
      console.log(config)
      console.log('  Example page')
      createPath(`${outputDir}/${category}s/${moduleName}`)

      // Compile demo page
      const template = pug.compileFile('./templates/example.pug')
      fs.writeFileSync(`examples/widgets/line-chart/index.html`, template({
        config: {
          name: 'line-chart',
          libs: ['d3', 'd3-interpolate-path'],
          description: 'Line charts are most commonly used to show <span class="good">temporal changes</span> or trends in quantitative data. As the data points are connected, it is expected that consecutive points are <span class="good">related</span> to each other.',
          widget: 'lineChart',
        }
      }))

      return api
    }
  }

  return api
}
