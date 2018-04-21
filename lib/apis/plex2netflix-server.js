'use strict';

const got = require('got');

module.exports = function(media) {
  return new Promise((resolve, reject) => {
    got('https://plex2netflix.now.sh/search', {
      json: true,
      query: {
        imdb: media.imdb,
        title: media.imdb ? null : media.title,
        year: media.imdb ? null : media.year,
      },
    })
      .then(response => {
        const countries = response.body.countries;
        resolve([media, countries]);
      })
      .catch(err => {
        reject([media, err]);
      });
  });
};
