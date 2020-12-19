const dependencies = require('./dependencies')
const compile = require('./compile')


const PAGES = [
  'gapminder'
]


function build (name) {
  compile(`./docs/tutorials/${name}/index.pug`, `./docs/tutorials/${name}/index.html`, {
    dependencies
  })
}

module.exports = function (name) {
  // Index.
  compile('./docs/tutorials/index.pug', './docs/tutorials/index.html')

  // Tutorial pages.
  if (typeof name !== 'undefined') {
    const pages = name === 'all' ? PAGES : [name]
    pages.forEach(page => {
      console.log(`Building tutorials: ${page}`)
      build(page)
    })
  }
}
