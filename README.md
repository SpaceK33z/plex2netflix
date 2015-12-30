# plex2netflix

This simple tool checks how much of your media from Plex is available to watch on Netflix, and gives you a nice summary with the percentage of media that is available.

I made this tool because I someday want to make the jump to Netflix, but I want to know beforehand how much of my media is available there.

To install, you need to have [Node.js](https://nodejs.org) installed. Install the tool with the node package manager:

```
npm install -g SpaceK33z/plex2netflix
```

## Usage

First, you need to get your [API token from Plex](https://support.plex.tv/hc/en-us/articles/204059436-Finding-your-account-token-X-Plex-Token).

```
plex2netflix --host 192.168.0.42 --token=xxx --section=Movies
```

If your Plex server lives at a non-default port, you can use `--port`.
