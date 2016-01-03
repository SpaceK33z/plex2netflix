#!/usr/bin/env node
'use strict';

var _ = require('./');

var _2 = _interopRequireDefault(_);

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _package = require('../package');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var argv = _yargs2.default.string('section').alias('section', 's').describe('section', 'Comma-separated library section titles from Plex').demand('token').alias('token', 't').describe('token', 'API token from Plex').string('host').default('host', '127.0.0.1').describe('host', 'Hostname for Plex Web').default('port', 32400).describe('port', 'Port for Plex Web').boolean('show-imdb').default('show-imdb', false).describe('show-imdb', 'Show IMDb IDs in the output').describe('year', 'Filter media in library section on release year').help('help').alias('help', 'h').version(function () {
    return _package2.default.version;
}).strict().argv;

new _2.default({ // eslint-disable-line no-new
    librarySections: argv.section ? argv.section.split(',') : undefined,
    token: argv.token,
    hostname: argv.host,
    port: argv.port,
    year: argv.year,
    showImdb: argv.showImdb
});