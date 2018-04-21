#!/usr/bin/env node
const Plex2Netflix = require('./');
const yargs = require('yargs');

const argv = yargs
  .string('section')
  .alias('section', 's')
  .describe('section', 'Comma-separated library section titles from Plex')
  .demand('token')
  .alias('token', 't')
  .describe('token', 'API token from Plex')
  .string('host')
  .default('host', '127.0.0.1')
  .describe('host', 'Hostname for Plex Web')
  .string('country')
  .default('country', 'us')
  .describe('country', 'Country code for Netflix')
  .default('port', 32400)
  .describe('port', 'Port for Plex Web')
  .boolean('show-imdb')
  .default('show-imdb', false)
  .describe('show-imdb', 'Show IMDb IDs in the output')
  .describe('year', 'Filter media in library section on release year')
  .help()
  .alias('help', 'h')
  .version()
  .strict().argv;

new Plex2Netflix({
  // eslint-disable-line no-new
  librarySections: argv.section ? argv.section.split(',') : undefined,
  token: argv.token,
  hostname: argv.host,
  port: argv.port,
  year: argv.year,
  showImdb: argv.showImdb,
  country: argv.country,
});
