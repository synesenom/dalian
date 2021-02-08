const fs = require('fs')
const documentation = require('documentation')
const { JSDOM } = require('jsdom')
const compile = require('../utils/compile')
const dependencies = require('../utils/dependencies')
const modules = require('../modules')
const { getModuleCategory, getModuleName, getFactoryName } = require('../utils/path')
const ModuleParser = require('../parsers/module-parser')


const ROOT = './docs/catalogue'
const SRC_DIR = 'src'


const getContent = d => {
  const tokens = d.split('/')
  return `${ROOT}/${tokens[0]}/${tokens[tokens.length - 1]}/content.html`
}

const hasExample = d => fs.existsSync(getContent(d))

function getSection(modules, section) {
  return modules.filter(d => getModuleCategory(d) === section)
    .filter(hasExample)
    .map(d => {
      const content = fs.readFileSync(getContent(d), {encoding: 'utf8'})
      const document = new JSDOM(content).window.document
      return {
        category: getModuleCategory(d),
        name: getModuleName(d),
        factory: getFactoryName(d),
        script: document.getElementsByClassName('card-example')[0].outerHTML
      }
    })
}


module.exports = {
  index() {
    console.log('Building catalogue index')
    compile(`${ROOT}/index.pug`, `${ROOT}/index.html`,{
      dependencies,
      components: getSection(modules, 'components'),
      controls: getSection(modules, 'controls'),
      charts: getSection(modules, 'charts')
    })
  },

  pages(names) {
    const currentModules = typeof names === 'undefined' ? modules : names
    currentModules.filter(hasExample)
      .forEach(async d => {
        // Generate documentation.
        const docs = await documentation.build([`${SRC_DIR}/${d}.js`], {
          shallow: true
        }).then(documentation.formats.json)
          .then(JSON.parse)

        ModuleParser(docs, d).buildExamplePage()
      })
  }
}
