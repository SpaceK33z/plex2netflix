#!/usr/bin/env node
var Plex2Netflix = require('./');
var argv = require('yargs')
    .demand('section').alias('section', 's').describe('section', 'Library section title from Plex')
    .demand('token').alias('token', 't').describe('token', 'API token from Plex')
    .string('host').default('host', '127.0.0.1').describe('host', 'Hostname for Plex Web')
    .default('port', 32400).describe('port', 'Port for Plex Web')
    .describe('year', 'Filter media in library section on release year')
    .help('help').alias('help', 'h')
    .strict()
    .argv;

new Plex2Netflix({
    librarySection: argv.section,
    token: argv.token,
    hostname: argv.host,
    port: argv.port,
    year: argv.year,
});
