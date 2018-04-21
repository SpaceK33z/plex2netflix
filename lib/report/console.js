'use strict';

const chalk = require('chalk');

const chalkError = chalk.bold.red;
const chalkSuccess = chalk.bold.green;
const chalkInfo = chalk.bold.blue;

function logMovie(item, msg) {
  let imdb = '';
  if (this.options.showImdb) {
    imdb = `, ${item.imdb ? item.imdb : 'no imdb id'}`;
  }
  console.log(`${item.title} (${item.year}${imdb}) - ${msg}`);
}

function divide() {
  console.log('-------');
}

module.exports = {
  connectSuccess() {
    console.log('Successfully connected to Plex.');
  },
  beforeSearchSection(section) {
    divide();
    console.log(chalkInfo(`Searching in ${section.title}.`));
    divide();
  },
  afterSearch(summary) {
    divide();
    console.log('Media searched:', chalkInfo(summary.size));
    console.log('Media available on netflix:', chalkInfo(summary.available));
    const percent = summary.available / summary.size * 100;
    console.log(
      'Percent available on netflix:',
      chalkInfo(`${Math.round(percent * 100) / 100}%`)
    );
  },
  movieAvailable(item) {
    logMovie.call(this, item, chalkSuccess('yes'));
  },
  movieUnavailable(item) {
    logMovie.call(this, item, chalkError('nope'));
  },
  movieError(item, err) {
    logMovie.call(
      this,
      item,
      chalkError(
        `failed request (code: ${err ? err.statusCode || err : 'unknown'})`
      )
    );
  },
};
