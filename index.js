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
    sectionTitle: '',
};

function exit(err) {
    console.error(String(err));
    process.exit(1);
}

function Plex2Netflix(options) {
    this.options = _.extend({}, defaults, options);

    this.plexClient = new PlexAPI(_.pick(this.options, 'hostname', 'port', 'token', 'username', 'password'));

    this.plexClient.query('/library/sections').then(function (result) {
        console.log('Successfully connected to Plex.');
        var sections = result._children;
        // Try to find the given section.
        var theSection = _.findWhere(sections, { title: this.options.librarySection });

        // If section can't be found, list all sections and exit.
        if (!theSection) {
            var sectionTitles = _.map(sections, 'title');
            exit(new Error('No library section found. Searched in sections: ' + sectionTitles.join(', ')));
        }

        console.log(chalkInfo('Searching in ' + theSection.title + '.'));
        this.getMediaForSection(theSection.uri);
    }.bind(this), exit);
}

Plex2Netflix.prototype.displayMovie = function (item, msg) {
    console.log(item.title + ' (' + item.year + ') - ' + msg);
}

Plex2Netflix.prototype.displaySummary = function (mediaLength, availableCounter) {
    console.log('-------');
    console.log('Media in this section:', chalkInfo(mediaLength));
    console.log('Media available on netflix:', chalkInfo(availableCounter));
    var percent = (availableCounter / mediaLength) * 100;
    console.log('Percent available on netflix:', chalkInfo((Math.round(percent * 100) / 100) + '%'));
}

Plex2Netflix.prototype.getMediaForSection = function (sectionUri) {
    var maybeAddYear = this.options.year ? '?year=' + this.options.year : '';

    this.plexClient.query(sectionUri + '/all' + maybeAddYear).then(function (result) {
        var media = result._children;
        if (!_.isArray(media) || !media.length) {
            exit(new Error('No media found in library section.'));
        }

        // This counter keeps track of how many media is available on Netflix.
        var availableCounter = 0;

        console.log('-------');
        Promise.map(media, function (item) {
            // TODO: The `title` can also contain non-English words. Maybe there is a way to always get the English title?
            // For even more accuracy we should really use the IMDB id.
            return netflixRoulette(item.title, item.year)
                .then(function(data) {
                    if (data) {
                        availableCounter += 1;
                        return this.displayMovie(item, chalkSuccess('yes'));
                    }
                    this.displayMovie(item, chalkError('nope'));
                }.bind(this))
                .catch(function(err) {
                    this.displayMovie(item, chalkError('failed request (code: ' + (err.statusCode || err) + ')'));
                }.bind(this));
        }.bind(this)).then(function() {
            this.displaySummary(media.length, availableCounter);
        }.bind(this));

    }.bind(this), exit);
};

module.exports = Plex2Netflix;
