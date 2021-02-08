const fs = require('fs')
const meta = require('../utils/meta')
const compile = require('../utils/compile')
const getFileSize = require('../utils/file-size')


const ROOT = './docs/'
const UNPKG_URL = 'https://unpkg.com'
const GITHUB_BANNER = 'templates/github-banner-new.html'


module.exports = {
  index() {
    console.log('Building home page')
    compile(`${ROOT}/index.pug`, `${ROOT}/index.html`, {
      // GitHub banner.
      gitHubBanner: fs.readFileSync(`${ROOT}/${GITHUB_BANNER}`, {
        encoding: 'utf-8'
      }),

      // Download links.
      download: {
        minjs: {
          url: 'dl/dalian.min.js',
          size: Math.round(getFileSize('docs/dl/dalian.min.js') / 1000)
        },
        gzip: {
          url: 'dl/dalian.min.js.gz',
          size: Math.round(getFileSize('docs/dl/dalian.min.js.gz') / 1000)
        }
      },

      // Install commands.
      install: {
        node: `${meta.name}.min.js`,
        browser: {
          dependencies: meta.dependencies
            .map(d => `<script src="${UNPKG_URL}/${d.lib}@${d.version}"></script>`)
            .join('\n'),
          module: {
            unpkg: `<script src="${UNPKG_URL}/${meta.name}"></script>`,
            local: `<script src="${meta.name}.min.js"></script>`
          }
        }
      }
    })
  }
}
