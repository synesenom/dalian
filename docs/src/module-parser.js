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


// TODO Get rid of config parameter
module.exports = (meta, docs, widgetName) => {
  const factoryName = widgetName.split('-').map(d => d.charAt(0).toUpperCase() + d.substring(1)).join('')

  // Dependencies
  const dependencies = Object.entries(meta.dependencies).map(d => ({
    lib: d[0],
    version: d[1].match(/(\d+.\d+.\d+)$/)[0]
  }))

  // Parse documentation blocks and sort them alphabetically
  let blocks = docs.map(BlockParser)
    .sort((a, b) => a.id() === factoryName ? -1 : a.id().localeCompare(b.id()))

  let api = {
    // TODO Remove hard-coded content
    buildReferencePage: () => {
      const path = 'api/widgets'
      createPath(path)

      // Build template
      const template = pug.compileFile('./templates/api-page.pug')
      fs.writeFileSync(`${path}/${widgetName}.html`, template({
        // Documentation root directory
        rootDir: '../../',

        // GitHub banner
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
        },

        // Content
        pageTitle: `${factoryName} | dalian`,
        mainHeading: factoryName,
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

        exampleUrl: `synesenom.github.io/dalian/catalogue/widgets/${widgetName}`
      }))
      return api
    },

    buildExamplePage: () => {
      const path = 'catalogue/widgets'
      createPath(path)

      // Build template
      const template = pug.compileFile('./templates/example-page.pug')
      const description = fs.readFileSync(`catalogue/widgets/${widgetName}/description.html`, {encoding: 'utf8'})
      const example = fs.readFileSync(`catalogue/widgets/${widgetName}/example.html`, {encoding: 'utf8'})

      fs.writeFileSync(`${path}/${widgetName}/index.html`, template({
        title: factoryName,
        dependencies,
        description,
        example,
        minjs: '../../../dl/dalian.min.js',
        widgetName,
        variableName: factoryName.charAt(0).toLowerCase() + factoryName.substring(1)
      }))
      return api
    }
  }

  return api
}
