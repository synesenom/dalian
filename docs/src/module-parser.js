const fs = require('fs')
const BlockParser = require('./block-parser')
const pug = require('pug')
const { JSDOM } = require('jsdom')


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


module.exports = (meta, docs, modulePath) => {
  const type = modulePath.split('/')[0]
  const moduleName = modulePath.split('/').slice(-1)[0]
  const factoryName = moduleName.split('-').map(d => d.charAt(0).toUpperCase() + d.substring(1)).join('')

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
      console.log(`Building: API reference page (${moduleName})`)
      const path = `api/${type}`
      createPath(path)

      // Build template
      const template = pug.compileFile('./templates/api-page.pug')
      fs.writeFileSync(`${path}/${moduleName}.html`, template({
        // Documentation root directory
        rootDir: '../../',

        // Type
        type,

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

        exampleUrl: `synesenom.github.io/dalian/catalogue/${type}/${moduleName}`
      }))
      return api
    },

    buildExamplePage: () => {
      console.log(`Building: Example page (${moduleName})`)
      const path = `catalogue/${type}`
      createPath(path)

      // Build template
      const template = pug.compileFile('./templates/catalogue-page.pug')
      const content = fs.readFileSync(`catalogue/${type}/${moduleName}/content.html`, {encoding: 'utf8'})
      const document = new JSDOM(content).window.document

      fs.writeFileSync(`${path}/${moduleName}/index.html`, template({
        type,
        modulePath,
        title: factoryName,
        dependencies,
        description: document.getElementById('desc').innerHTML,
        code: Array.from(document.getElementsByClassName('doc')).map(d => d.outerHTML)
          .concat(Array.from(document.getElementsByClassName('doc-hidden')).map(d => d.outerHTML))
          .join(''),
        minjs: '../../../dl/dalian.min.js',
        widgetName: moduleName,
        variableName: type === 'widgets' ? factoryName.charAt(0).toLowerCase() + factoryName.substring(1) : 'chart'
      }))
      return api
    }
  }

  return api
}
