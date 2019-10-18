const fs = require('fs')
const BlockParser = require('./block-parser')
const pug = require('pug')
const sass = require('node-sass')
const ncp = require('ncp')


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

  let api = {
    buildReferencePage: dir => {
      console.log('  API reference page')
      let path = `${dir}/${category}s`
      createDir(path)

      // Compile style file
      const style = fs.readFileSync('./style/style.scss', {encoding: 'utf-8'})
      const baseStyle = sass.renderSync({
        data: style,
        outputStyle: 'compressed'
      }).css.toString()

      // Github banner
      const gitHubBanner = fs.readFileSync('./templates/github-banner.html', {encoding: 'utf-8'})

      const template = pug.compileFile('./templates/reference.pug')
      fs.writeFileSync(`${path}/${moduleName}.html`, template({
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
    buildDemoPage: dir => {
      console.log('  Demo page')
      const path = `${dir}/${category}s/${moduleName}`
      createPath(path)

      // Copy module specific files
      fs.copyFileSync('../modules/widgets/line-chart/demo/content.js', 'demo/widgets/line-chart/content.js')

      // Compile demo page
      const template = pug.compileFile('./templates/demo.pug')
      fs.writeFileSync(`demo/widgets/line-chart/index.html`, template({
        config: {
          root: '../../',
          name: `${lib}/${packageName}`,
          libs: [
            'd3.v5.min.js',
            'd3-interpolate-path.min.js',
            'demo.js'
          ],
          dalian: [
            'https://unpkg.com/@dalian/core',
            'https://unpkg.com/@dalian/component-chart',
            '../../../../modules/widgets/line-chart/dist/dalian.widget-line-chart.min.js'
          ],
          content: 'content.js',
          styles: [
            '../../style/style.css'
          ]
        }
      }))

      return api
    },
    buildExamplePage: dir => {
      console.log('  Example page')
      const path = `${dir}/${category}s/${moduleName}`

      // TODO
      createPath(path)
    }
  }

  return api
}
