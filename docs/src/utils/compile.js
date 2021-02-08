const fs = require('fs')
const pug = require('pug')

module.exports = function (input, output, config) {
  const template = pug.compileFile(input, {})
  fs.writeFileSync(output, template(config));
}
