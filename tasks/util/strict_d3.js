var path = require('path');
var transformTools = require('browserify-transform-tools');
var constants = require('./constants');

var pathToStrictD3Module = path.join(
    constants.pathToImageTest,
    'strict-d3.js'
);
var normalizedPathToStrictD3Module = pathToStrictD3Module.replace(/\\/g, '/'); // replacing of "\" for windows users

/**
 * Transform `require('d3')` expressions to `require(/path/to/strict-d3.js)`
 */

module.exports = transformTools.makeRequireTransform('requireTransform',
    { evaluateArguments: true, jsFilesOnly: true },
    function(args, opts, cb) {
        var pathIn = args[0];
        var pathOut;

        if(pathIn === 'd3' && opts.file !== pathToStrictD3Module) {
            pathOut = 'require(\'' + normalizedPathToStrictD3Module + '\')';
        }

        if(pathOut) return cb(null, pathOut);
        else return cb();
    });
