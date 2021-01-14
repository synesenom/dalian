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

  // Parse documentation blocks and sort them alphabetically, but put the factory method to the first place.
  let blocks = docs.map(BlockParser)
    .sort((a, b) => a.id.localeCompare(b.id))
  let i = blocks.findIndex(d => d.id === factoryName)
  let firstBlock = blocks.splice(i, 1)
  blocks = firstBlock.concat(blocks)

  let api = {
    buildReferencePage: () => {
      console.log(`Building: API reference page (${moduleName})`)
      const path = `docs/api/${type}`
      createPath(path)

      // Build template
      const template = pug.compileFile('./docs/templates/api-page.pug')
      fs.writeFileSync(`${path}/${moduleName}.html`, template({
        // Documentation root directory
        rootDir: '../../',

        // Type
        type,

        // Content
        pageTitle: `${factoryName} | dalian`,
        mainHeading: factoryName,
        menu: blocks.map(d => d.id),
        reference: blocks.map(d => Object.assign(d, {
            signature: (() => {
              const s = d.signature
              return s.startsWith(factoryName) ? s : `${factoryName}.${s}`
            })()
        })),

        exampleUrl: `../../docs/catalogue/${type}/${moduleName}`
      }))
      return api
    },

    buildExamplePage: () => {
      console.log(`Building: Example page (${moduleName})`)
      const path = `docs/catalogue/${type}`
      createPath(path)

      // Build template
      const template = pug.compileFile('./docs/templates/example.pug')
      const content = fs.readFileSync(`docs/catalogue/${type}/${moduleName}/content.html`, {encoding: 'utf8'})
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
        controls: document.getElementById('controls') && document.getElementById('controls').innerHTML,
        minjs: '../../../dl/dalian.min.js',
        widgetName: moduleName,
        variableName: type === 'widgets' ? factoryName.charAt(0).toLowerCase() + factoryName.substring(1) : 'chart'
      }))
      return api
    }
  }

  return api
}
