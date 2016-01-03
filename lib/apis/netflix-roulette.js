'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (media) {
    return new _bluebird2.default(function (resolve, reject) {
        // If an IMDB id is given, use this to search. It's way more accurate.
        if (media.imdb) {
            return (0, _got2.default)('https://netflixroulette.net/api/v2/usa/imdb/', { query: { imdbId: media.imdb }, json: true }).then(function (response) {
                resolve([media, response.body.netflix_id || null]);
            }).catch(function (err) {
                // This API sometimes returns an empty response, which returns a lengthy parse error.
                if (err.name === 'ParseError') {
                    reject([media, Error('invalid response')]);
                }
                reject([media, err]);
            });
        }

        // Fallback to using the media title and year.
        return (0, _got2.default)('https://netflixroulette.net/api/v2/usa/search/', { query: { phrase: media.title, year: media.year }, json: true }).then(function (response) {
            var isAvailable = response.body.netflix_results && response.body.netflix_results.length || null;
            resolve([media, isAvailable]);
        }).catch(function (err) {
            if (err.statusCode === 404) {
                return resolve([media, null]);
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