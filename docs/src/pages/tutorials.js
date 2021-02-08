const meta = require('../utils/meta')
const compile = require('../utils/compile')


const ROOT = './docs/tutorials'
const PAGES = [
  'gapminder'
]


module.exports = {
  index() {
    console.log('Building tutorials index')
    compile(`${ROOT}/index.pug`, `${ROOT}/index.html`)
  },

  pages(names) {
    const pages = typeof names === 'undefined' ? PAGES : names
    pages.forEach(page => {
      console.log(`Building tutorials: ${page}`)
      compile(`${ROOT}/${page}/index.pug`, `${ROOT}/${page}/index.html`, {
        dependencies: meta.dependencies
      })
    })
  }
}
