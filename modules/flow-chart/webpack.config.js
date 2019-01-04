const path = require('path');
const libraryName = 'dalian';
const moduleName = 'chart';

const browserConfig = {
    target: 'web',
    mode: 'production',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: `${libraryName}.${moduleName}.min.js`,
        library: libraryName
    }
};

module.exports = [ browserConfig ];