'use strict';

const PlexAPI = require('plex-api');
const _ = require('lodash');
const plex2NetflixServer = require('./apis/plex2netflix-server');
const rConsole = require('./report/console');

const defaults = {
  hostname: '127.0.0.1',
  port: 32400,
  report: rConsole,
  showImdb: false,
};

function exit(err) {
  console.error(String(err));
  process.exit(1); // eslint-disable-line no-process-exit
}

function executeSequentially(promiseFactories) {
  let result = Promise.resolve();
  promiseFactories.forEach(promiseFactory => {
    result = result.then(promiseFactory);
  });
  return result;
}

function Plex2Netflix(options) {
  this.options = Object.assign({}, defaults, options);
  this.summary = { size: 0, available: 0 };

  this.plexClient = new PlexAPI(
    _.pick(this.options, 'hostname', 'port', 'token', 'username', 'password')
  );

  this.plexClient
    .query('/library/sections')
    .then(result => {
      this.reportOption('connectSuccess');

      if (this.options.librarySections) {
        return this.findSpecificLibraries(result.MediaContainer.Directory);
      }

      return this.findAllLibraries(result.MediaContainer.Directory);
    })
    .then(sections => {
      return executeSequentially(
        sections.map(section => {
          return () => {
            this.reportOption('beforeSearchSection', section);
            return this.getMediaForSection(`/library/sections/${section.key}`);
          };
        })
      );
    })
    .then(() => {
      this.reportOption('afterSearch', this.summary);
    })
    .catch(exit);
}

Plex2Netflix.prototype.reportOption = function(option, first, second) {
  return this.options.report[option].call(this, first, second);
};

Plex2Netflix.prototype.findSpecificLibraries = function(sections) {
  const sectionResults = [];
  // Try to find all sections.
  this.options.librarySections.forEach(sectionTitle => {
    const theSection = _.find(sections, { title: sectionTitle });
    // If section can't be found, list all sections and exit.
    if (!theSection) {
      const sectionTitles = _.map(sections, 'title');
      exit(
        new Error(
          `Library section "${sectionTitle}" not found. Searched in sections: ${sectionTitles.join(
            ', '
          )}`
        )
      );
    }

    sectionResults.push(theSection);
  });

  return sectionResults;
};

Plex2Netflix.prototype.findAllLibraries = function(sections) {
  // Only include show and movie libraries, and libraries with an agent.
  return sections.filter(section => {
    return (
      ['show', 'movie'].indexOf(section.type) >= 0 &&
      section.agent !== 'com.plexapp.agents.none'
    );
  });
};

Plex2Netflix.prototype.getMediaMetadata = function(mediaUri) {
  return this.plexClient.query(mediaUri).then(result => {
    if (
      result.MediaContainer.Metadata &&
      result.MediaContainer.Metadata.length
    ) {
      const firstChild = result.MediaContainer.Metadata[0];
      // Try to find the IMDB id in this mess.
      // TODO: Maybe iterate over the children until an IMDb id is found?
      const guid = firstChild.guid;
      let imdb;
      if (guid) {
        imdb = guid.match(/tt\d{7}/);
      }

      // For TV shows `result.parentTitle` and `result.parentYear` should be used.
      // For movies, `firstChild.originalTitle` contains the title without translation.
      // If this is empty, `firstChild.title` should be used.
      const title =
        result.MediaContainer.parentTitle ||
        firstChild.originalTitle ||
        firstChild.title;
      return {
        imdb: imdb ? imdb[0] : null,
        title: this.filterTitle(title),
        year: result.MediaContainer.parentYear || firstChild.year,
      };
    }
    return null;
  });
};

Plex2Netflix.prototype.filterTitle = function(title) {
  // Sometimes a title contains the year at the end, e.g. `The Americans (2013)`.
  // This needs to be filtered out.
  return String(title)
    .replace(/\(\d{4}\)$/g, '')
    .replace("'", '')
    .trim();
};

Plex2Netflix.prototype.getMediaForSection = function(sectionUri) {
  const maybeAddYear = this.options.year ? `?year=${this.options.year}` : '';

  return this.plexClient
    .query(`${sectionUri}/all${maybeAddYear}`)
    .then(result => {
      const media = result.MediaContainer.Metadata;
      if (!_.isArray(media) || !media.length) {
        exit(new Error('No media found in library section.'));
      }

      // This counter keeps track of how many media is available on Netflix.
      let availableCounter = 0;

      return Promise.all(
        media.map(item => {
          return this.getMediaMetadata(item.key)
            .then(plex2NetflixServer)
            .then(args => {
              const mediaItem = args[0];
              const countryList = args[1];
              if (countryList.indexOf(this.options.country) >= 0) {
                availableCounter += 1;
                return this.reportOption('movieAvailable', mediaItem);
              }
              this.reportOption('movieUnavailable', mediaItem);
              return null;
            })
            .catch(err => this.reportOption('movieError', item, err));
        })
      ).then(() => {
        this.summary.size += media.length;
        this.summary.available += availableCounter;
      });
    })
    .catch(exit);
};

module.exports = Plex2Netflix;
