# 0.3.1 - 2015-01-04
## Changed
- Improve accuracy in TV shows. If Plex doesn't provide a IMDb ID, it will now search for the IMDb ID on OMDb. Previously it searched with the Netflix Roulette API, but this was very inaccurate.

# 0.3.0 - 2016-01-03
## Added
- `--show-imdb` argument, this will help debug if a match is incorrect. It will show the IMDb ID next to each meda item. If a media item has the correct IMDb ID and the match is incorrect, it is probably the fault of the API, not plex2netflix.

## Changed
- Improve accuracy somewhat for media without IMDb ID; if the year is in the title. e.g. `The Americans (2013)`, it will filter out the year (`The Americans`).
- Improvacy accuracy by using `originalTitle` from the Plex API (only for movies); this means that always the original title of the movie is used (not e.g. a translated one).
- Preparations for custom output reports.

# 0.2.2 - 2016-01-03
## Added
- If no `--section` parameter is given, it will auto detect libraries that have movies or TV shows.
- `--section` can handle multiple libraries, comma-separated.
- `--version` argument.

## Changed
- Huge changes in the build process. ES6 is used with Babel now.

# 0.2.1 - 2015-12-30
## Fixed
- Support for TV shows.

# 0.2.0 - 2015-12-30
## Changed
- Try to use the IMDb ID if found.
