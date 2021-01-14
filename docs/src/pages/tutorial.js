const meta = require('../utils/meta')
const compile = require('../compile')


const ROOT = './docs/tutorials'
const PAGES = [
  'gapminder'
]


module.exports = function (name) {
  // Index page.
  console.log('Building tutorials index')
  compile(`${ROOT}/index.pug`, `${ROOT}/index.html`)

  // Tutorial pages.
  if (typeof name === 'string') {
    const pages = name === 'all' ? PAGES : [name]
    pages.forEach(page => {
      console.log(`Building tutorials: ${page}`)
      compile(`${ROOT}/${page}/index.pug`, `${ROOT}/${page}/index.html`, {
        dependencies: meta.dependencies
      })
    })
  }
}
