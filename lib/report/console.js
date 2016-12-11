'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var chalkError = _chalk2.default.bold.red;
var chalkSuccess = _chalk2.default.bold.green;
var chalkInfo = _chalk2.default.bold.blue;

function logMovie(item, msg) {
    var imdb = '';
    if (this.options.showImdb) {
        imdb = ', ' + (item.imdb ? item.imdb : 'no imdb id');
    }
    console.log(item.title + ' (' + item.year + imdb + ') - ' + msg);
}

function divide() {
    console.log('-------');
}

exports.default = {
    connectSuccess: function connectSuccess() {
        console.log('Successfully connected to Plex.');
    },
    beforeSearchSection: function beforeSearchSection(section) {
        divide();
        console.log(chalkInfo('Searching in ' + section.title + '.'));
        divide();
    },
    afterSearch: function afterSearch(summary) {
        divide();
        console.log('Media searched:', chalkInfo(summary.size));
        console.log('Media available on netflix:', chalkInfo(summary.available));
        var percent = summary.available / summary.size * 100;
        console.log('Percent available on netflix:', chalkInfo(Math.round(percent * 100) / 100 + '%'));
    },
    movieAvailable: function movieAvailable(item) {
        logMovie.call(this, item, chalkSuccess('yes'));
    },
    movieUnavailable: function movieUnavailable(item) {
        logMovie.call(this, item, chalkError('nope'));
    },
    movieError: function movieError(item, err) {
        logMovie.call(this, item, chalkError('failed request (code: ' + (err ? err.statusCode || err : 'unknown') + ')'));
    }
};