const documentation = require('documentation')
const modules = require('../modules')
const compile = require('../utils/compile')
const { getModuleCategory, getModuleName, getFactoryName } = require('../utils/path')
const ModuleParser = require('../parsers/module-parser')


const ROOT = './docs/api'
const SRC_DIR = 'src'

// TODO Compile public methods only.
module.exports = {
  index() {
    // Index page.
    console.log('Building API index')
    compile(`${ROOT}/index.pug`, `${ROOT}/index.html`, {
      modules: Object.entries(modules.reduce((map, d) => {
        const category = getModuleCategory(d)
        const name = getModuleName(d)
        const factory = getFactoryName(d)

        if (typeof map[category] === 'undefined') {
          map[category] = []
        }
        map[category].push({name, factory})
        return map
      }, {})).map(([category, entries]) => ({
        category,
        entries
      }))
    })
  },

  pages(names) {
    const currentModules = typeof names === 'undefined' ? modules : names
    currentModules.forEach(async d => {
      // Generate documentation.
      const docs = await documentation.build([`${SRC_DIR}/${d}.js`], {
        shallow: true
      }).then(documentation.formats.json)
        .then(JSON.parse)

      ModuleParser(docs, d).buildReferencePage()
    })
  }
}
