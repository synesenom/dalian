const fs = require('fs')
const BlockParser = require('./block-parser')
const pug = require('pug')
const sass = require('node-sass')


module.exports = (docs, meta) => {
  // Extract library name, module name and factory name
  const libraryName = meta.name.split('/')[0].slice(1)
  const packageName = meta.name.split('/')[1]
  const description = meta.description
  const category = packageName.split('-')[0]
  const moduleName = packageName.split('-').slice(1).join('-')
  const factoryName = moduleName.split('-').map(d => d[0].toUpperCase() + d.slice(1)).join('')

  // Parse documentation blocks and sort them alphabetically
  let blocks = docs.map(BlockParser)
    .sort((a, b) => a.id() === factoryName ? -1 : a.id().localeCompare(b.id()))

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

  let api = {
    buildReferencePage: dir => {
      console.log('  API reference page')
      let path = `${dir}/${category}s`
      createDir(path)

      // Github banner
      const gitHubBanner = fs.readFileSync('./templates/github-banner.html', {encoding: 'utf-8'})

      // Build template
      const template = pug.compileFile('./templates/reference.pug')
      fs.writeFileSync(`${path}/${moduleName}.html`, template({
        gitHubBanner,
        install: {
          node: `@${libraryName}/${packageName}`
        },
        content: {
          title: `${moduleName} | ${libraryName}`,
          heading: factoryName,
          description,
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
          // demo: `synesenom.github.io/${lib}/demo/${category}s/${moduleName}`,
          example: `synesenom.github.io/${libraryName}/examples/${category}s/${moduleName}`
        }
      }))
      return api
    },

    buildDemoPage: dir => {
      console.log('  Demo page')
      const path = `${dir}/${category}s/${moduleName}`
      createPath(path)

      // Copy module specific files
      fs.copyFileSync('../modules/widgets/line-chart/demo/content.js', 'demo/widgets/line-chart/content.js')

      // Compile demo page
      const template = pug.compileFile('./templates/demo.pug')
      fs.writeFileSync(`demo/widgets/line-chart/index.html`, template({
        config: {

        }
      }))

      return api
    },

    buildExamplePage: dir => {
      console.log('  Example page')
      const path = `${dir}/${category}s/${moduleName}`

      // TODO
      createPath(path)

      // Compile demo page
      const template = pug.compileFile('./templates/example.pug')
      fs.writeFileSync(`examples/widgets/line-chart/index.html`, template({
        config: {
          libs: ['d3', 'd3-interpolate-path'],
          description: 'Line charts are most commonly used to show <span class="good">temporal changes</span> or trends in quantitative data. As the data points are connected, it is expected that consecutive points are <span class="good">related</span> to each other.',
          widget: 'lineChart'
        }
      }))

      return api
    }
  }

  return api
}
