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
  if (typeof name === 'undefined')
    return

  const pages = name === 'undefined' ? PAGES : [name]
  pages.forEach(page => {
    console.log(`Building tutorials: ${page}`)
    build(page)
  })
}
