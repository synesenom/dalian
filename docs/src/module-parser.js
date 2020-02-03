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
      console.log(`Building: API reference page (${widgetName})`)
      const path = 'api/charts'
      createPath(path)

      // Build template
      const template = pug.compileFile('./templates/api-page.pug')
      fs.writeFileSync(`${path}/${widgetName}.html`, template({
        // Documentation root directory
        rootDir: '../../',

        // Content
        pageTitle: `${factoryName} | dalian`,
        mainHeading: factoryName,
        menu: blocks.map(d => d.id()),
        reference: blocks.map(d => {
          return {
            id: d.id(),
            signature: (() => {
              const s = d.signature()
              return s.startsWith(factoryName) ? s : `${factoryName}.${s}`
            })(),
            description: d.description(),
            params: d.params(),
            returns: d.returns()
          }
        }),

        exampleUrl: `synesenom.github.io/dalian/catalogue/charts/${widgetName}`
      }))
      return api
    },

    buildExamplePage: () => {
      console.log(`Building: Example page (${widgetName})`)
      const path = 'catalogue/charts'
      createPath(path)

      // Build template
      const template = pug.compileFile('./templates/example-page.pug')
      const description = fs.readFileSync(`catalogue/charts/${widgetName}/description.html`, {encoding: 'utf8'})
      const example = fs.readFileSync(`catalogue/charts/${widgetName}/example.html`, {encoding: 'utf8'})

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
