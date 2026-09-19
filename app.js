/* =====================================================================
   PULSETUBE — SIMPLE VERSION
   =====================================================================
   This is a stripped-down version of the full app, built to be read
   top-to-bottom in one sitting. It intentionally leaves out:

     - hash-based routing / multiple pages   (just one screen here)
     - localStorage caching & favorites      (nothing is saved)
     - the "self-healing" blocked-video fix  (just skips on error)
     - lazy loading, pagination, categories

   The full version's guide explains WHY those extra pieces exist.
   This file is only about the two core ideas every part of that
   app is built on:

     1) Search YouTube for videos  (YouTube Data API v3)
     2) Play a video's audio       (YouTube IFrame Player API)
   ===================================================================== */


// ---------------------------------------------------------------------
// STEP 0 — Your API key
// ---------------------------------------------------------------------
// Get a free key from Google Cloud Console → enable "YouTube Data API v3"
// → Credentials → Create API Key. Paste it below.
const API_KEY = "AIzaSyC6p3nFVDYTqFg7bel2LPpJ9Nu54fexgJ0";


// ---------------------------------------------------------------------
// STEP 1 — Grab the HTML elements we'll be updating
// ---------------------------------------------------------------------
const searchForm    = document.getElementById("searchForm");
const searchInput   = document.getElementById("searchInput");
const resultsEl     = document.getElementById("results");

const playerThumb   = document.getElementById("playerThumb");
const playerTitle   = document.getElementById("playerTitle");
const playerChannel = document.getElementById("playerChannel");
const playPauseBtn  = document.getElementById("playPauseBtn");
const prevBtn       = document.getElementById("prevBtn");
const nextBtn       = document.getElementById("nextBtn");


// ---------------------------------------------------------------------
// STEP 2 — Simple in-memory state (nothing is saved to disk)
// ---------------------------------------------------------------------
let currentResults = [];   // the list of songs currently on screen
let currentIndex = -1;     // which song in that list is playing
let ytPlayer = null;       // will hold the YouTube player once it's ready
let isPlayerReady = false;


// ---------------------------------------------------------------------
// STEP 3 — Search YouTube (YouTube Data API v3)
// ---------------------------------------------------------------------
// This talks to https://www.googleapis.com/youtube/v3/search
// It returns JSON with basic info: title, channel, thumbnail, videoId.
// It does NOT return duration or whether the video can be embedded —
// that would need a second call (see the full version's youtube.js).
// We skip that here to keep things simple.
async function searchYouTube(query) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", `${query} music`);   // bias results toward songs
  url.searchParams.set("type", "video");
  url.searchParams.set("videoCategoryId", "10");  // "10" = YouTube's Music category
  url.searchParams.set("maxResults", "12");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("YouTube search failed. Check your API key and quota.");
  }
  const data = await response.json();

  // Turn YouTube's raw JSON into a simple, clean array we can work with.
  return data.items.map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.medium.url
  }));
}


// ---------------------------------------------------------------------
// STEP 4 — Render search results as clickable cards
// ---------------------------------------------------------------------
function renderResults(songs) {
  currentResults = songs;

  if (songs.length === 0) {
    resultsEl.innerHTML = `<p class="empty">No results found.</p>`;
    return;
  }

  // Build one card of HTML per song, then join them all together.
  resultsEl.innerHTML = songs.map((song, index) => `
    <div class="card" data-index="${index}">
      <img src="${song.thumbnail}" alt="" />
      <div class="info">
        <h3>${escapeHtml(song.title)}</h3>
        <p>${escapeHtml(song.channel)}</p>
      </div>
    </div>
  `).join("");

  // Attach a click handler to every card we just created.
  resultsEl.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => {
      const index = Number(card.dataset.index);
      playSongAt(index);
    });
  });
}

// Turns "<" and other special characters into safe text, so a song
// title can never accidentally be interpreted as HTML code.
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}


// ---------------------------------------------------------------------
// STEP 5 — Handle the search form submit
// ---------------------------------------------------------------------
searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();               // stop the page from reloading
  const query = searchInput.value.trim();
  if (!query) return;

  resultsEl.innerHTML = `<p class="hint">Searching...</p>`;
  try {
    const songs = await searchYouTube(query);
    renderResults(songs);
  } catch (error) {
    resultsEl.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
  }
});


// ---------------------------------------------------------------------
// STEP 6 — The YouTube IFrame Player API
// ---------------------------------------------------------------------
// This is a SEPARATE api from the search API above. This one actually
// plays a video. The <script src="https://www.youtube.com/iframe_api">
// tag in index.html loads a script that, once ready, calls this exact
// global function by name:
window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player("youtube-player", {
    height: "1",
    width: "1",
    playerVars: { autoplay: 1, controls: 0 },
    events: {
      onReady: () => { isPlayerReady = true; },
      onStateChange: handlePlayerStateChange,
      onError: handlePlayerError
    }
  });
};

function handlePlayerStateChange(event) {
  const isPlaying = event.data === YT.PlayerState.PLAYING;
  playPauseBtn.textContent = isPlaying ? "⏸ Pause" : "▶ Play";

  // When a song finishes, automatically play the next one.
  if (event.data === YT.PlayerState.ENDED) {
    playNext();
  }
}

// If a video can't play here (owner blocked it, it was removed, etc.),
// the simple version just skips to the next song and tells you why.
// (The full version tries to find a replacement first — see the guide.)
function handlePlayerError(event) {
  console.warn("This video could not be played (error code:", event.data, "). Skipping.");
  playNext();
}


// ---------------------------------------------------------------------
// STEP 7 — Playing a song from the results list
// ---------------------------------------------------------------------
function playSongAt(index) {
  const song = currentResults[index];
  if (!song || !isPlayerReady) return;

  currentIndex = index;

  // Update the bottom player bar with this song's info.
  playerThumb.src = song.thumbnail;
  playerTitle.textContent = song.title;
  playerChannel.textContent = song.channel;

  // Tell the YouTube player to load and play this specific video.
  ytPlayer.loadVideoById(song.videoId);
}

function playNext() {
  if (currentIndex < currentResults.length - 1) {
    playSongAt(currentIndex + 1);
  }
}

function playPrevious() {
  if (currentIndex > 0) {
    playSongAt(currentIndex - 1);
  }
}


// ---------------------------------------------------------------------
// STEP 8 — Wire up the transport buttons
// ---------------------------------------------------------------------
playPauseBtn.addEventListener("click", () => {
  if (!ytPlayer || currentIndex === -1) return;
  const state = ytPlayer.getPlayerState();
  if (state === YT.PlayerState.PLAYING) ytPlayer.pauseVideo();
  else ytPlayer.playVideo();
});

nextBtn.addEventListener("click", playNext);
prevBtn.addEventListener("click", playPrevious);
