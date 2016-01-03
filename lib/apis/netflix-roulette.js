'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (media) {
    return new _bluebird2.default(function (resolve, reject) {
        function findByImdbId(imdb) {
            return (0, _got2.default)('https://netflixroulette.net/api/v2/usa/imdb/', { query: { imdbId: imdb }, json: true }).then(function (response) {
                resolve([media, response.body.netflix_id || null]);
            }).catch(function (err) {
                // This API sometimes returns an empty response, which returns a lengthy parse error.
                if (err.name === 'ParseError') {
                    reject([media, Error('invalid response')]);
                }
                reject([media, err]);
            });
        }

        // If an IMDb id is given, use this to search. It's way more accurate.
        if (media.imdb) {
            return findByImdbId(media.imdb);
        }

        // Search for the IMDb ID on OMDB (because that API is free).
        return (0, _got2.default)('https://omdbapi.com/', { query: { t: media.title, year: media.year }, json: true }).then(function (response) {
            var imdbID = response.body.imdbID;
            if (imdbID) {
                media.imdb = imdbID;
                // Okay, now finally search on Netflix Roulette.
                return findByImdbId(imdbID);
            }
            reject([media, Error('IMDb ID not found (searched on OMDB)')]);
        }).catch(function (err) {
            if (err.statusCode === 404) {
                reject([media, Error('media not found (searched on OMDB with title and year)')]);
            }
            reject([media, err]);
        });
    });
};

var _got = require('got');

var _got2 = _interopRequireDefault(_got);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }