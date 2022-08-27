const { ArgumentParser } = require('argparse')
const home = require('./src/pages/home')
const catalogue = require('./src/pages/catalogue')
const api = require('./src/pages/api')
const tutorials = require('./src/pages/tutorials')

const parser = new ArgumentParser({
  description: 'Documentation builder'
})
parser.add_argument('-i', '--home', {
  help: 'Compile home page [off].',
  action: 'store_true'
})
parser.add_argument('-c', '--catalogue', {
  help: 'Compile catalogue [off].',
  action: 'store_true'
})
parser.add_argument('-t', '--tutorials', {
  help: 'Compile tutorial pages [off].',
  action: 'store_true'
})
parser.add_argument('-a', '--api', {
  help: 'Compile API pages [off].',
  action: 'store_true'
})
parser.add_argument('-d', '--docs', {
  help: 'Compile documentation [off].'
})

const args = parser.parse_args()

// Build home page.
if (args.home) {
  home.index()
}

// Build tutorials.
if (args.tutorials) {
  tutorials.index()
  tutorials.pages()
}

// Build catalogue.
if (args.catalogue) {
  catalogue.index()
  catalogue.pages()
}

// Build API pages.
if (args.api) {
  api.index()
  api.pages()
}
