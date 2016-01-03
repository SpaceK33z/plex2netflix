'use strict';

var _plexApi = require('plex-api');

var _plexApi2 = _interopRequireDefault(_plexApi);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _netflixRoulette = require('./apis/netflix-roulette');

var _netflixRoulette2 = _interopRequireDefault(_netflixRoulette);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var chalkError = _chalk2.default.bold.red;
var chalkSuccess = _chalk2.default.bold.green;
var chalkInfo = _chalk2.default.bold.blue;

var defaults = {
    hostname: '127.0.0.1',
    port: 32400
};

function exit(err) {
    console.error(String(err));
    process.exit(1);
}

function executeSequentially(promiseFactories) {
    var result = _bluebird2.default.resolve();
    promiseFactories.forEach(function (promiseFactory) {
        result = result.then(promiseFactory);
    });
    return result;
}

function Plex2Netflix(options) {
    var _this = this;

    this.options = _lodash2.default.extend({}, defaults, options);
    this.summary = { size: 0, available: 0 };

    this.plexClient = new _plexApi2.default(_lodash2.default.pick(this.options, 'hostname', 'port', 'token', 'username', 'password'));

    this.plexClient.query('/library/sections').then(function (result) {
        console.log('Successfully connected to Plex.');

        if (_this.options.librarySections) {
            return _this.findSpecificLibraries(result._children);
        }

        return _this.findAllLibraries(result._children);
    }).then(function (sections) {
        return executeSequentially(sections.map(function (section) {
            return function () {
                console.log(chalkInfo('Searching in ' + section.title + '.'));
                return _this.getMediaForSection(section.uri);
            };
        }));
    }).then(this.displaySummary.bind(this)).catch(exit);
}

Plex2Netflix.prototype.findSpecificLibraries = function (sections) {
    var sectionResults = [];
    // Try to find all sections.
    this.options.librarySections.forEach(function (sectionTitle) {
        var theSection = _lodash2.default.findWhere(sections, { title: sectionTitle });
        // If section can't be found, list all sections and exit.
        if (!theSection) {
            var sectionTitles = _lodash2.default.map(sections, 'title');
            exit(new Error('Library section "' + sectionTitle + '" not found. Searched in sections: ' + sectionTitles.join(', ')));
        }

        sectionResults.push(theSection);
    });

    return sectionResults;
};

Plex2Netflix.prototype.findAllLibraries = function (sections) {
    // Only include show and movie libraries, and libraries with an agent.
    return sections.filter(function (section) {
        return _lodash2.default.includes(['show', 'movie'], section.type) && section.agent !== 'com.plexapp.agents.none';
    });
};

Plex2Netflix.prototype.displayMovie = function (item, msg) {
    console.log(item.title + ' (' + item.year + ') - ' + msg);
};

Plex2Netflix.prototype.displaySummary = function () {
    console.log('-------');
    console.log('Media searched:', chalkInfo(this.summary.size));
    console.log('Media available on netflix:', chalkInfo(this.summary.available));
    var percent = this.summary.available / this.summary.size * 100;
    console.log('Percent available on netflix:', chalkInfo(Math.round(percent * 100) / 100 + '%'));
};

Plex2Netflix.prototype.getMediaMetadata = function (mediaUri) {
    return this.plexClient.query(mediaUri).then(function (result) {
        if (result._children && result._children.length) {
            var firstChild = result._children[0];
            // Try to find the IMDB id in this mess.
            // TODO: Maybe iterate over the children until an IMDb id is found?
            var guid = firstChild.guid;
            if (guid) {
                var imdb = guid.match(/tt\d{7}/);
                if (imdb) {
                    return { imdb: imdb[0] };
                }
            }

            // If no match to an IMDb ID can be made, fallback to using the title + year.
            // For TV shows `result.parentTitle` and `result.parentYear` should be used.
            // TODO: The `title` can also contain non-English words. Maybe there is a way to always get the English title?
            return {
                title: result.parentTitle || firstChild.title,
                year: result.parentYear || firstChild.year
            };
        }
    });
};

Plex2Netflix.prototype.getMediaForSection = function (sectionUri) {
    var _this2 = this;

    var maybeAddYear = this.options.year ? '?year=' + this.options.year : '';

    return this.plexClient.query(sectionUri + '/all' + maybeAddYear).then(function (result) {
        var media = result._children;
        if (!_lodash2.default.isArray(media) || !media.length) {
            exit(new Error('No media found in library section.'));
        }

        // This counter keeps track of how many media is available on Netflix.
        var availableCounter = 0;

        console.log('-------');
        return _bluebird2.default.all(media.map(function (item) {
            return _this2.getMediaMetadata(item.key).then(_netflixRoulette2.default).then(function (isAvailable) {
                if (isAvailable) {
                    availableCounter += 1;
                    return _this2.displayMovie(item, chalkSuccess('yes'));
                }
                _this2.displayMovie(item, chalkError('nope'));
            }).catch(function (err) {
                _this2.displayMovie(item, chalkError('failed request (code: ' + (err.statusCode || err) + ')'));
            });
        })).then(function () {
            _this2.summary.size += media.length;
            _this2.summary.available += availableCounter;
        });
    }).catch(exit);
};

module.exports = Plex2Netflix;