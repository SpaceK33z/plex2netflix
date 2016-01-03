'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _plexApi = require('plex-api');

var _plexApi2 = _interopRequireDefault(_plexApi);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _netflixRoulette = require('./apis/netflix-roulette');

var _netflixRoulette2 = _interopRequireDefault(_netflixRoulette);

var _console = require('./report/console');

var _console2 = _interopRequireDefault(_console);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaults = {
    hostname: '127.0.0.1',
    port: 32400,
    report: _console2.default,
    showImdb: false
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
        _this.reportOption('connectSuccess');

        if (_this.options.librarySections) {
            return _this.findSpecificLibraries(result._children);
        }

        return _this.findAllLibraries(result._children);
    }).then(function (sections) {
        return executeSequentially(sections.map(function (section) {
            return function () {
                _this.reportOption('beforeSearchSection', section);
                return _this.getMediaForSection(section.uri);
            };
        }));
    }).then(function () {
        _this.reportOption('afterSearch', _this.summary);
    }).catch(exit);
}

Plex2Netflix.prototype.reportOption = function (option) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
    }

    return this.options.report[option].apply(this, args);
};

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

Plex2Netflix.prototype.getMediaMetadata = function (mediaUri) {
    var _this2 = this;

    return this.plexClient.query(mediaUri).then(function (result) {
        if (result._children && result._children.length) {
            var firstChild = result._children[0];
            // Try to find the IMDB id in this mess.
            // TODO: Maybe iterate over the children until an IMDb id is found?
            var guid = firstChild.guid;
            var imdb = undefined;
            if (guid) {
                imdb = guid.match(/tt\d{7}/);
            }

            // For TV shows `result.parentTitle` and `result.parentYear` should be used.
            // For movies, `firstChild.originalTitle` contains the title without translation.
            // If this is empty, `firstChild.title` should be used.
            return {
                imdb: imdb ? imdb[0] : null,
                title: _this2.filterTitle(result.parentTitle || firstChild.originalTitle || firstChild.title),
                year: result.parentYear || firstChild.year
            };
        }
    });
};

Plex2Netflix.prototype.filterTitle = function (title) {
    // Sometimes a title contains the year at the end, e.g. `The Americans (2013)`.
    // This needs to be filtered out.
    return String(title).replace(/\(\d{4}\)$/g, '').trim();
};

Plex2Netflix.prototype.getMediaForSection = function (sectionUri) {
    var _this3 = this;

    var maybeAddYear = this.options.year ? '?year=' + this.options.year : '';

    return this.plexClient.query(sectionUri + '/all' + maybeAddYear).then(function (result) {
        var media = result._children;
        if (!_lodash2.default.isArray(media) || !media.length) {
            exit(new Error('No media found in library section.'));
        }

        // This counter keeps track of how many media is available on Netflix.
        var availableCounter = 0;

        return _bluebird2.default.all(media.map(function (item) {
            return _this3.getMediaMetadata(item.key).then(_netflixRoulette2.default).then(function (args) {
                var _args = _slicedToArray(args, 2);

                var mediaItem = _args[0];
                var isAvailable = _args[1];

                if (isAvailable) {
                    availableCounter += 1;
                    return _this3.reportOption('movieAvailable', mediaItem);
                }
                _this3.reportOption('movieUnavailable', mediaItem);
            }).catch(function (args) {
                return _this3.reportOption('movieError', args[0], args[1]);
            });
        })).then(function () {
            _this3.summary.size += media.length;
            _this3.summary.available += availableCounter;
        });
    }).catch(exit);
};

module.exports = Plex2Netflix;