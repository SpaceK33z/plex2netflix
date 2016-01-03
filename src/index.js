import PlexAPI from 'plex-api';
import _ from 'lodash';
import Promise from 'bluebird';
import chalk from 'chalk';
import netflixRoulette from './apis/netflix-roulette';

const chalkError = chalk.bold.red;
const chalkSuccess = chalk.bold.green;
const chalkInfo = chalk.bold.blue;

const defaults = {
    hostname: '127.0.0.1',
    port: 32400,
};

function exit(err) {
    console.error(String(err));
    process.exit(1);
}

function executeSequentially(promiseFactories) {
    let result = Promise.resolve();
    promiseFactories.forEach(function(promiseFactory) {
        result = result.then(promiseFactory);
    });
    return result;
}

function Plex2Netflix(options) {
    this.options = _.extend({}, defaults, options);
    this.summary = { size: 0, available: 0 };

    this.plexClient = new PlexAPI(_.pick(this.options, 'hostname', 'port', 'token', 'username', 'password'));

    this.plexClient.query('/library/sections')
    .then((result) => {
        console.log('Successfully connected to Plex.');

        if (this.options.librarySections) {
            return this.findSpecificLibraries(result._children);
        }

        return this.findAllLibraries(result._children);
    })
    .then((sections) => {
        return executeSequentially(sections.map((section) => {
            return () => {
                console.log(chalkInfo(`Searching in ${section.title}.`));
                return this.getMediaForSection(section.uri);
            };
        }));
    })
    .then(this.displaySummary.bind(this))
    .catch(exit);
}

Plex2Netflix.prototype.findSpecificLibraries = function(sections) {
    const sectionResults = [];
    // Try to find all sections.
    this.options.librarySections.forEach(function(sectionTitle) {
        const theSection = _.findWhere(sections, { title: sectionTitle });
        // If section can't be found, list all sections and exit.
        if (!theSection) {
            const sectionTitles = _.map(sections, 'title');
            exit(new Error(`Library section "${sectionTitle}" not found. Searched in sections: ${sectionTitles.join(', ')}`));
        }

        sectionResults.push(theSection);
    });

    return sectionResults;
};

Plex2Netflix.prototype.findAllLibraries = function(sections) {
    // Only include show and movie libraries, and libraries with an agent.
    return sections.filter(function(section) {
        return _.includes(['show', 'movie'], section.type) && section.agent !== 'com.plexapp.agents.none';
    });
};

Plex2Netflix.prototype.displayMovie = function(item, msg) {
    console.log(`${this.filterTitle(item.title)} (${item.year}) - ${msg}`);
};

Plex2Netflix.prototype.displaySummary = function() {
    console.log('-------');
    console.log('Media searched:', chalkInfo(this.summary.size));
    console.log('Media available on netflix:', chalkInfo(this.summary.available));
    const percent = (this.summary.available / this.summary.size) * 100;
    console.log('Percent available on netflix:', chalkInfo((Math.round(percent * 100) / 100) + '%'));
};

Plex2Netflix.prototype.getMediaMetadata = function(mediaUri) {
    return this.plexClient.query(mediaUri).then((result) => {
        if (result._children && result._children.length) {
            const firstChild = result._children[0];
            // Try to find the IMDB id in this mess.
            // TODO: Maybe iterate over the children until an IMDb id is found?
            const guid = firstChild.guid;
            let imdb;
            if (guid) {
                imdb = guid.match(/tt\d{7}/);
            }

            // If no match to an IMDb ID can be made, fallback to using the title + year.
            // For TV shows `result.parentTitle` and `result.parentYear` should be used.
            // TODO: The `title` can also contain non-English words. Maybe there is a way to always get the English title?
            return {
                imdb: imdb ? imdb[0] : null,
                title: this.filterTitle(result.parentTitle || firstChild.title),
                year: result.parentYear || firstChild.year,
            };
        }
    });
};

Plex2Netflix.prototype.filterTitle = function(title) {
    // Sometimes a title contains the year at the end, e.g. `The Americans (2013)`.
    // This needs to be filtered out.
    return String(title).replace(/\(\d{4}\)$/g, '').trim();
};

Plex2Netflix.prototype.getMediaForSection = function(sectionUri) {
    const maybeAddYear = this.options.year ? '?year=' + this.options.year : '';

    return this.plexClient.query(sectionUri + '/all' + maybeAddYear)
    .then((result) => {
        const media = result._children;
        if (!_.isArray(media) || !media.length) {
            exit(new Error('No media found in library section.'));
        }

        // This counter keeps track of how many media is available on Netflix.
        let availableCounter = 0;

        console.log('-------');
        return Promise.all(media.map((item) => {
            return this.getMediaMetadata(item.key)
                .then(netflixRoulette)
                .then((isAvailable) => {
                    if (isAvailable) {
                        availableCounter += 1;
                        return this.displayMovie(item, chalkSuccess('yes'));
                    }
                    this.displayMovie(item, chalkError('nope'));
                })
                .catch((err) => {
                    this.displayMovie(item, chalkError(`failed request (code: ${err.statusCode || err})`));
                });
        }))
        .then(() => {
            this.summary.size += media.length;
            this.summary.available += availableCounter;
        });
    })
    .catch(exit);
};

module.exports = Plex2Netflix;
