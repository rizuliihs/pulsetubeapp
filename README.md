# PulseTube — Simple Version

A stripped-down version of PulseTube, built to be read and understood in
one sitting. Three files total:

- `index.html` — one page, no routing
- `style.css` — plain styling, ~170 lines
- `app.js` — all the logic, one file, ~225 lines, heavily commented

## What's different from the full version

This version keeps only the two core ideas everything else is built on:

1. **Search YouTube** — `searchYouTube(query)` calls the YouTube Data API
   v3's `search.list` endpoint and turns the response into a plain array
   of `{ videoId, title, channel, thumbnail }` objects.
2. **Play a video** — `window.onYouTubeIframeAPIReady` sets up the
   official YouTube IFrame Player API, and `playSongAt(index)` tells it
   which video to load.

Everything else from the full app was removed on purpose:

| Removed | Why it's not here |
|---|---|
| Multiple pages / hash routing | One screen is enough to see the whole flow |
| localStorage (favorites, queue, cache, history) | Nothing needs to persist to understand the core idea |
| The two-step `search.list` + `videos.list` fetch | This version skips fetching duration/embeddable status |
| The `isPlayable()` filter, blocked-video list, auto-replace logic | This version just skips to the next song on error instead |
| Lazy loading / `IntersectionObserver` | There's only one results grid, loaded all at once |

Once this version makes sense, the full version's 5-day guide will read
much more easily — every extra piece in it exists to solve a specific
problem this simple version doesn't try to solve.

## Setup

1. Open `app.js` and paste your YouTube Data API key into:
   ```js
   const API_KEY = "PASTE_YOUR_YOUTUBE_API_KEY_HERE";
   ```
2. Serve the folder with any static server (it uses `type="module"`, so
   it won't work opened directly as a `file://` URL):
   ```bash
   npx serve .
   ```
   or
   ```bash
   python -m http.server 8787
   ```
3. Open the local URL, search a song, and click a card to play it.

## Reading order

Open `app.js` and read it top to bottom — it's split into 8 numbered
steps as comments, in the exact order things happen:

1. API key
2. Grab HTML elements
3. Search YouTube
4. Render results as cards
5. Handle the search form
6. Set up the YouTube player
7. Play a song
8. Wire up the buttons
