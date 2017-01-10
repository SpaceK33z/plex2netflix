# plex2netflix

This simple tool checks how much of your media from Plex is available to watch on Netflix, and gives you a nice summary with the percentage of media that is available.

I made this tool because I someday want to make the jump to Netflix, but I want to know beforehand how much of the media I have is available there.

It works by using the Plex Web API to get a list of all media from given library section. If an item has an IMDb ID (you need to enable the IMDb agent for this in Plex), it uses this to search in the [uNoGS](http://unogs.com/) database which has Netflix availability data. If there is no IMDb ID, the item title and year are used.

[**Powered by uNoGS**](http://unogs.com/).

<img src="./example.png" width="609" alt="Example">

## Install

You need to have [Node.js](https://nodejs.org) (4.0 or higher). Install the tool with the node package manager:

```
npm install -g plex2netflix
```

To update, just run the command above again.

## Usage

First, you need to get your [API token from Plex](https://support.plex.tv/hc/en-us/articles/204059436-Finding-your-account-token-X-Plex-Token).

```
plex2netflix --host 192.168.0.42 --token=xxx --country=us --section=Movies
```

By default it searches the Netflix library of the US. You can specify `--country` to let it search in a Netflix library of a different country. For example, to search in the Netherlands, add `--country=nl`.

Optionally comma-separate the sections like `--section=Movies,Shows`. If you leave out `--section`, it will try to automatically find libraries.

If your Plex server lives at a non-default port, you can use `--port`.

Maybe you only want to know if media from this release year is already on Netflix:

```
plex2netflix --host 192.168.0.42 --token=xxx --section=Movies --year=2015
```
