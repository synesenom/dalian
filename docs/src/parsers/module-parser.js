const fs = require('fs')
const dependencies = require('../utils/dependencies')
const BlockParser = require('./block-parser')
const pug = require('pug')
const { JSDOM } = require('jsdom')
const createPath = require('../utils/create-path')
const { getModuleName, getModuleCategory, getFactoryName } = require('../utils/path')
const compile = require('../utils/compile')


const CATALOGUE_ROOT = './docs/catalogue'


module.exports = (docs, modulePath) => {
  const factoryName = getModuleName(modulePath).split('-').map(d => d.charAt(0).toUpperCase() + d.substring(1)).join('')

  // Parse documentation blocks and sort them alphabetically, but put the factory method to the first place.
  let blocks = docs.map(BlockParser)
    .sort((a, b) => a.id.localeCompare(b.id))
  let i = blocks.findIndex(d => d.id === factoryName)
  let firstBlock = blocks.splice(i, 1)
  blocks = firstBlock.concat(blocks)

  let api = {
    buildReferencePage: () => {
      const factoryName = getFactoryName(modulePath)
      const moduleName = getModuleName(modulePath)
      const category = getModuleCategory(modulePath)
      console.log(`Building: API reference page (${moduleName})`)
      const path = `docs/api/${category}`
      createPath(path)

      // Build template
      const template = pug.compileFile('./docs/templates/api-page.pug')
      fs.writeFileSync(`${path}/${moduleName}.html`, template({
        // Documentation root directory
        rootDir: '../../',

        // Type
        type: category,

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

        exampleUrl: `../../catalogue/${category}/${moduleName}/`
      }))
      return api
    },

    // TODO Move this to src/pages/catalogue
    buildExamplePage: () => {
      console.log(`Building example page: ${modulePath}`)
      const moduleName = getModuleName(modulePath)
      const category = getModuleCategory(modulePath)
      const path = `${CATALOGUE_ROOT}/${category}`
      createPath(path)

      const content = fs.readFileSync(`${CATALOGUE_ROOT}/${category}/${moduleName}/content.html`, {encoding: 'utf8'})
      const document = new JSDOM(content).window.document

      // Build template
      compile('./docs/templates/example.pug', `${path}/${moduleName}/index.html`, {
        category,
        modulePath,
        moduleName,
        factoryName: getFactoryName(modulePath),
        dependencies,
        description: document.getElementById('desc').innerHTML,
        code: Array.from(document.getElementsByClassName('doc')).map(d => d.outerHTML)
          .concat(Array.from(document.getElementsByClassName('doc-hidden')).map(d => d.outerHTML))
          .join(''),
        controls: document.getElementById('controls') && document.getElementById('controls').innerHTML,
        minjs: '../../../dl/dalian.min.js'
      })

      return api
    }
  }

  return api
}
