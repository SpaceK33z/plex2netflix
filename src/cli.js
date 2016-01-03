#!/usr/bin/env node
import Plex2Netflix from './';
import yargs from 'yargs';
import pkg from '../package';

const argv = yargs
    .string('section').alias('section', 's').describe('section', 'Comma-separated library section titles from Plex')
    .demand('token').alias('token', 't').describe('token', 'API token from Plex')
    .string('host').default('host', '127.0.0.1').describe('host', 'Hostname for Plex Web')
    .default('port', 32400).describe('port', 'Port for Plex Web')
    .describe('year', 'Filter media in library section on release year')
    .help('help').alias('help', 'h')
    .version(() => pkg.version)
    .strict()
    .argv;

new Plex2Netflix({ // eslint-disable-line no-new
    librarySections: argv.section ? argv.section.split(',') : undefined,
    token: argv.token,
    hostname: argv.host,
    port: argv.port,
    year: argv.year,
});
