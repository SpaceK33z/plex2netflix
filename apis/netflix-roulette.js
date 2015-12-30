var got = require('got');
var Promise = require('bluebird');
var _ = require('lodash');

module.exports = function(title, year) {
    return new Promise(function(resolve, reject) {
        got('http://netflixroulette.net/api/api.php', { query: { title: title, year: year }, json: true })
            .then(function (response) {
                resolve(response.body || null);
            })
            .catch(function (err) {
                if (err.statusCode === 404) {
                    resolve(null, err);
                } else {
                    reject(err);
                }
            });
    });
}
