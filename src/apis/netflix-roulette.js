import got from 'got';
import Promise from 'bluebird';

export default function(media) {
    return new Promise(function(resolve, reject) {
        // If an IMDB id is given, use this to search. It's way more accurate.
        if (media.imdb) {
            return got('https://netflixroulette.net/api/v2/usa/imdb/', { query: { imdbId: media.imdb }, json: true })
                .then(function(response) {
                    resolve([media, response.body.netflix_id || null]);
                })
                .catch(function(err) {
                    // This API sometimes returns an empty response, which returns a lengthy parse error.
                    if (err.name === 'ParseError') {
                        reject([media, Error('invalid response')]);
                    }
                    reject([media, err]);
                });
        }

        // Fallback to using the media title and year.
        return got('https://netflixroulette.net/api/v2/usa/search/', { query: { phrase: media.title, year: media.year }, json: true })
            .then(function(response) {
                const isAvailable = response.body.netflix_results && response.body.netflix_results.length || null;
                resolve([media, isAvailable]);
            })
            .catch(function(err) {
                if (err.statusCode === 404) {
                    return resolve([media, null]);
                }
                reject([media, err]);
            });
    });
}
