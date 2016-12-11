const got = require('got');

module.exports = function (media) {
    return new Promise((resolve, reject) => {
        function findByImdbId(imdb) {
            return got('https://netflixroulette.net/api/v2/usa/imdb/', { query: { imdbId: imdb }, json: true })
            .then((response) => {
                resolve([media, response.body.netflix_id || null]);
            })
            .catch((err) => {
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
        return got('https://omdbapi.com/', { query: { t: media.title, year: media.year }, json: true })
            .then((response) => {
                const imdbID = response.body.imdbID;
                if (imdbID) {
                    media.imdb = imdbID;
                    // Okay, now finally search on Netflix Roulette.
                    return findByImdbId(imdbID);
                }
                reject([media, Error('IMDb ID not found (searched on OMDB)')]);
                return null;
            })
            .catch((err) => {
                if (err.statusCode === 404) {
                    reject([media, Error('media not found (searched on OMDB with title and year)')]);
                }
                reject([media, err]);
            });
    });
}
