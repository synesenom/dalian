const fs = require('fs')
const BlockParser = require('./block-parser')
const pug = require('pug')
const sass = require('node-sass')


module.exports = (docs, meta) => {
  // Extract library name, module name and factory name
  const lib = meta.name.split('/')[0].slice(1)
  const packageName = meta.name.split('/')[1]
  const category = packageName.split('-')[0]
  const moduleName = packageName.split('-').slice(1).join('-')
  const factory = moduleName.split('-').map(d => d[0].toUpperCase() + d.slice(1)).join('')

  // Parse documentation blocks and sort them alphabetically
  let blocks = docs.map(BlockParser)
    .sort((a, b) => a.id() === factory ? -1 : a.id().localeCompare(b.id()))

  let api = {
    buildReferencePage: path => {
      // Compile style file
      const style = fs.readFileSync('./style/style.scss', {encoding: 'utf-8'})
      const baseStyle = sass.renderSync({
        data: style,
        outputStyle: 'compressed'
      }).css.toString()

      // Github banner
      const gitHubBanner = fs.readFileSync('./templates/github-banner.html', {encoding: 'utf-8'})

      const template = pug.compileFile('./templates/api-reference.pug')
      fs.writeFileSync(`${path}/${category}s/${moduleName}.html`, template({
        html: {
          gitHubBanner
        },
        styles: {
          base: baseStyle
        },
        content: {
          menu: blocks.map(d => d.id()),
          reference: blocks.map(d => {
            return {
              id: d.id(),
              signature: `${factory}.${d.signature()}`,
              description: d.description(),
              params: d.params(),
              returns: d.returns()
            }
          }),
          demo: `synesenom.github.io/${lib}/demo/${category}s/${moduleName}`,
          example: `synesenom.github.io/${lib}/examples/${category}s/${moduleName}`
        }
      }))
      return api
    },
    buildDemoPage: path => {
      return api
    },
    buildExamplePage: path => {

    }
  }

  return api
}
