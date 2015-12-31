var PlexAPI = require('plex-api');
var _ = require('lodash');
var Promise = require('bluebird');
var chalk = require('chalk');
var chalkError = chalk.bold.red;
var chalkSuccess = chalk.bold.green;
var chalkInfo = chalk.bold.blue;
var netflixRoulette = require('./apis/netflix-roulette');

var defaults = {
    hostname: '127.0.0.1',
    port: 32400,
};

function exit(err) {
    console.error(String(err));
    process.exit(1);
}

function Plex2Netflix(options) {
    this.options = _.extend({}, defaults, options);
    this.summary = { size: 0, available: 0 };

    this.plexClient = new PlexAPI(_.pick(this.options, 'hostname', 'port', 'token', 'username', 'password'));

    this.plexClient.query('/library/sections').then(function (result) {
        console.log('Successfully connected to Plex.');

        if (this.options.librarySections) {
            var sectionResults = this.findSpecificLibraries(result._children);
        } else {
            var sectionResults = this.findAllLibraries(result._children);
        }

        return Promise.map(sectionResults, function (section) {
            console.log(chalkInfo('Searching in ' + section.title + '.'));
            return this.getMediaForSection(section.uri);
        }.bind(this)).then(function () {
            this.displaySummary();
        }.bind(this));
    }.bind(this), exit);
}

Plex2Netflix.prototype.findSpecificLibraries = function (sections) {
    var sectionResults = [];
    // Try to find all sections.
    this.options.librarySections.forEach(function (sectionTitle) {
        var theSection = _.findWhere(sections, { title: sectionTitle });
        // If section can't be found, list all sections and exit.
        if (!theSection) {
            var sectionTitles = _.map(sections, 'title');
            exit(new Error('Library section "' + sectionTitle + '" not found. Searched in sections: ' + sectionTitles.join(', ')));
        }

        sectionResults.push(theSection);
    });

    return sectionResults;
}

Plex2Netflix.prototype.findAllLibraries = function (sections) {
    // Only include show and movie libraries, and libraries with an agent.
    return sections.filter(function(section) {
        return _.includes(['show', 'movie'], section.type) && section.agent !== 'com.plexapp.agents.none';
    });
}

Plex2Netflix.prototype.displayMovie = function (item, msg) {
    console.log(item.title + ' (' + item.year + ') - ' + msg);
}

Plex2Netflix.prototype.displaySummary = function () {
    console.log('-------');
    console.log('Media searched:', chalkInfo(this.summary.size));
    console.log('Media available on netflix:', chalkInfo(this.summary.available));
    var percent = (this.summary.available / this.summary.size) * 100;
    console.log('Percent available on netflix:', chalkInfo((Math.round(percent * 100) / 100) + '%'));
}

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
}

Plex2Netflix.prototype.getMediaForSection = function (sectionUri) {
    var maybeAddYear = this.options.year ? '?year=' + this.options.year : '';

    return this.plexClient.query(sectionUri + '/all' + maybeAddYear).then(function (result) {
        var media = result._children;
        if (!_.isArray(media) || !media.length) {
            exit(new Error('No media found in library section.'));
        }

        // This counter keeps track of how many media is available on Netflix.
        var availableCounter = 0;

        console.log('-------');
        return Promise.map(media, function (item) {
            return this.getMediaMetadata(item.key)
                .then(netflixRoulette)
                .then(function(isAvailable) {
                    if (isAvailable) {
                        availableCounter += 1;
                        return this.displayMovie(item, chalkSuccess('yes'));
                    }
                    this.displayMovie(item, chalkError('nope'));
                }.bind(this))
                .catch(function(err) {
                    this.displayMovie(item, chalkError('failed request (code: ' + (err.statusCode || err) + ')'));
                }.bind(this));
        }.bind(this)).then(function() {
            this.summary.size += media.length;
            this.summary.available += availableCounter;
        }.bind(this));

    }.bind(this), exit);
};

module.exports = Plex2Netflix;
