import chalk from 'chalk';

const chalkError = chalk.bold.red;
const chalkSuccess = chalk.bold.green;
const chalkInfo = chalk.bold.blue;

function logMovie(item, msg) {
    console.log(`${item.title} (${item.year}) - ${msg}`);
}

function divide() {
    console.log('-------');
}

export default {
    connectSuccess() {
        console.log('Successfully connected to Plex.');
    },
    beforeSearchSection(section) {
        divide();
        console.log(chalkInfo(`Searching in ${section.title}.`));
        divide();
    },
    afterSearch(summary) {
        divide();
        console.log('Media searched:', chalkInfo(summary.size));
        console.log('Media available on netflix:', chalkInfo(summary.available));
        const percent = (summary.available / summary.size) * 100;
        console.log('Percent available on netflix:', chalkInfo((Math.round(percent * 100) / 100) + '%'));
    },
    movieAvailable: (item) => logMovie(item, chalkSuccess('yes')),
    movieUnavailable: (item) => logMovie(item, chalkError('nope')),
    movieError: (item, err) => logMovie(item, chalkError(`failed request (code: ${err.statusCode || err})`)),
};
