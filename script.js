import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAec2ZM3FYjJ1zPP08_zoYUuihD3lx2zeY",
  authDomain: "emotion-music-player-8e72b.firebaseapp.com",
  projectId: "emotion-music-player-8e72b",
  storageBucket: "emotion-music-player-8e72b.appspot.com",
  messagingSenderId: "475810239428",
  appId: "1:475810239428:web:bad135263e019052fa4a91",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const authContainer = document.getElementById("auth-container");
const appContainer = document.getElementById("app-container");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authButton = document.getElementById("auth-button");
const googleSignInButton = document.getElementById("google-signin");
const toggleLink = document.getElementById("toggle-link");
const authError = document.getElementById("auth-error");
const authToggle = document.getElementById("auth-toggle");
const signOutButton = document.getElementById("sign-out");
const moodButtons = document.getElementById("mood-buttons");
const playlistTitle = document.getElementById("playlist-title");
const songList = document.getElementById("song-list");
const playerText = document.getElementById("player-text");
const audioPlayer = document.getElementById("audio-player");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("toggle-password");
const playerBar = document.getElementById("player-bar");
const navPlaylists = document.getElementById("nav-playlists");
const shuffleToggle = document.getElementById("shuffle-toggle");
const loopToggle = document.getElementById("loop-toggle");

let currentMood = null;
let currentSongIndex = 0;
let isSignUp = false;
let isShuffling = false;
let favorites = [];

// Mood Music
const musicLibrary = {
  Happy: [
    { title: "Sunny Days", artist: "Artist 1", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", thumbnail: "https://via.placeholder.com/150" },
    { title: "Joyful Vibes", artist: "Artist 2", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", thumbnail: "https://via.placeholder.com/150" },
  ],
  Sad: [
    { title: "Tears in Rain", artist: "Artist 3", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", thumbnail: "https://via.placeholder.com/150" },
    { title: "Lonely Nights", artist: "Artist 4", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", thumbnail: "https://via.placeholder.com/150" },
  ],
  Energetic: [
    { title: "High Energy", artist: "Artist 1", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", thumbnail: "https://via.placeholder.com/150" },
    { title: "Pump It Up", artist: "Artist 2", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", thumbnail: "https://via.placeholder.com/150" },
  ],
  Calm: [
    { title: "Peaceful Waves", artist: "Artist 3", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", thumbnail: "https://via.placeholder.com/150" },
    { title: "Serenity", artist: "Artist 4", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", thumbnail: "https://via.placeholder.com/150" },
  ],
  Favorites: []
};

// Auth Toggle Handler
function setupToggleLink() {
  const newToggleLink = document.getElementById("toggle-link");
  newToggleLink.addEventListener("click", (e) => {
    e.preventDefault();
    isSignUp = !isSignUp;
    authTitle.textContent = isSignUp ? "Sign Up" : "Sign In";
    authButton.textContent = isSignUp ? "Sign Up" : "Sign In";
    authToggle.innerHTML = isSignUp
      ? `Already have an account? <a href="#" id="toggle-link">Sign In</a>`
      : `Don't have an account? <a href="#" id="toggle-link">Sign Up</a>`;
    setupToggleLink();
  });
}
setupToggleLink();

// Toggle Password Visibility
togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  togglePassword.textContent = isPassword ? "🙈" : "👁️";
});

// Email/Password Auth
authButton.addEventListener("click", () => {
  const email = document.getElementById("email").value.trim();
  const password = passwordInput.value.trim();
  authError.textContent = "";

  if (!email || !password) {
    authError.textContent = "Please enter both email and password.";
    return;
  }

  if (isSignUp) {
    authError.textContent = "Signing you up...";
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        authError.textContent = "Signed up! Logging you in...";
        showApp();
      })
      .catch((error) => {
        authError.textContent = error.message;
      });
  } else {
    authError.textContent = "Signing you in...";
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        authError.textContent = "Signed in! Please wait...";
        showApp();
      })
      .catch((error) => {
        authError.textContent = error.message;
      });
  }
});

// Google Sign-In with Popup and Redirect Fallback
googleSignInButton.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  authError.textContent = "";
  try {
    await signInWithPopup(auth, provider);
    showApp();
  } catch (error) {
    if (error.code === "auth/popup-blocked") {
      authError.textContent = "Popup blocked. Redirecting for Google Sign-In...";
      await signInWithRedirect(auth, provider);
    } else {
      authError.textContent = error.message;
    }
  }
});

// Handle Redirect Result
getRedirectResult(auth)
  .then((result) => {
    if (result) {
      showApp();
    }
  })
  .catch((error) => {
    authError.textContent = error.message;
  });

// Auth State Listener
document.addEventListener("DOMContentLoaded", () => {
  const loader = document.createElement("div");
  loader.id = "loader";
  loader.innerHTML = "<p>Loading...</p>";
  loader.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:#1e3c72;color:white;display:flex;align-items:center;justify-content:center;z-index:9999;";
  document.body.appendChild(loader);

  onAuthStateChanged(auth, async (user) => {
    document.body.removeChild(loader);
    if (user) {
      await loadFavorites(user.uid);
      showApp();
    } else {
      showAuth();
    }
  });
});

// Show App UI
async function showApp() {
  authContainer.classList.add("hidden");
  appContainer.classList.remove("hidden");
  document.getElementById("user-info").textContent = `Logged in as: ${auth.currentUser.email}`;
  initializeMusicPlayer();
  authError.textContent = ""; // Clear sign in message after success

}

// Show Auth UI
function showAuth() {
  authContainer.classList.remove("hidden");
  appContainer.classList.add("hidden");
  moodButtons.innerHTML = "";
  songList.innerHTML = "";
  playlistTitle.textContent = "Select a mood to view the playlist";
  playerText.textContent = "Select a song to play";
  audioPlayer.pause();
  audioPlayer.src = "";
  playerBar.classList.add("hidden");
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
}

// Sign Out
function setupSignOut() {
  signOutButton.addEventListener("click", () => {
    signOut(auth).then(() => {
      showAuth();
    }).catch((error) => {
      alert("Sign out failed: " + error.message);
    });
  });
}


// Init Mood Tabs
function initializeMusicPlayer() {
  moodButtons.innerHTML = "";
  const moodAssets = { Happy: "🎉", Sad: "🌧️", Energetic: "🔥", Calm: "🌙" };

  Object.keys(musicLibrary)
  .filter(mood => mood !== "Favorites")
  .forEach((mood) => {
    const tab = document.createElement("div");
    tab.className = "mood-tab";
    tab.innerHTML = `<div class="mood-icon">${moodAssets[mood]}</div><div class="mood-label">${mood}</div>`;
    tab.addEventListener("click", () => {
      showPlaylist(mood);
    });
    moodButtons.appendChild(tab);
});

}


// Load Favorites from Firestore
async function loadFavorites(userId) {
  musicLibrary.Favorites = [];
  const favoritesRef = collection(db, `favorites/${userId}/songs`);
  const snapshot = await getDocs(favoritesRef);
  snapshot.forEach(doc => {
    musicLibrary.Favorites.push(doc.data());
  });
}

// Toggle Favorite
async function toggleFavorite(song, mood) {
  const userId = auth.currentUser.uid;
  const songId = `${song.title}-${song.artist}`;
  const favoriteRef = doc(db, `favorites/${userId}/songs`, songId);
  const favoriteDoc = await getDoc(favoriteRef);
  
  if (favoriteDoc.exists()) {
    await deleteDoc(favoriteRef);
    musicLibrary.Favorites = musicLibrary.Favorites.filter(fav => fav.title !== song.title || fav.artist !== song.artist);
    return false;
  } else {
    const favoriteData = { ...song, mood };
    await setDoc(favoriteRef, favoriteData);
    musicLibrary.Favorites.push(favoriteData);
    return true;
  }
}

// Show Playlist
function showPlaylist(mood) {
  songList.innerHTML = "";
  playlistTitle.textContent = `${mood} Playlist`;
  const songs = musicLibrary[mood] || [];
  songs.forEach((song, index) => {
    const li = document.createElement("li");
    const isFav = musicLibrary.Favorites.some(fav => fav.title === song.title && fav.artist === song.artist);
li.innerHTML = `${song.title} - ${song.artist} 
  <button class="favorite-button ${isFav ? 'favorited' : ''}" data-song='${JSON.stringify(song)}' data-mood="${mood}">
    ${isFav ? "❤️" : "🤍"}
  </button>`;
    li.querySelector(".favorite-button").addEventListener("click", async (e) => {
      e.stopPropagation();
      const isFavorited = await toggleFavorite(song, mood);
      e.target.classList.toggle("favorited", isFavorited);
e.target.textContent = isFavorited ? "❤️" : "🤍";

    });
    if (musicLibrary.Favorites.some(fav => fav.title === song.title && fav.artist === song.artist)) {
      li.querySelector(".favorite-button").classList.add("favorited");
    }
    li.addEventListener("click", () => playSong(song, mood, index));
    songList.appendChild(li);
  });
}

// Play Song
function playSong(song, mood = null, index = 0) {
  playerText.textContent = `Now Playing: ${song.title} - ${song.artist}`;
  audioPlayer.src = song.url;
  audioPlayer.play();
  audioPlayer.volume = 1.0;

  document.getElementById("song-thumbnail").src = song.thumbnail;

  playerBar.classList.remove("hidden");
  playerBar.classList.add("show"); // Fade in
  playerBar.classList.remove("expanded"); // Start collapsed

  currentMood = mood;
  currentSongIndex = index;
}

// Fullscreen Overlay Elements
const overlay = document.getElementById("player-overlay");
const overlayThumbnail = document.getElementById("overlay-thumbnail");
const overlayTitle = document.getElementById("overlay-title");
const overlayArtist = document.getElementById("overlay-artist");
const overlayShuffle = document.getElementById("overlay-shuffle");
const overlayLoop = document.getElementById("overlay-loop");
const overlayPlay = document.getElementById("overlay-play");
const overlayPrev = document.getElementById("overlay-prev");
const overlayNext = document.getElementById("overlay-next");
const overlayFav = document.getElementById("overlay-fav");
const overlayClose = document.getElementById("overlay-close");

// Show Overlay with Song Info
function openOverlay(song) {
  overlay.classList.remove("hidden");
  overlayThumbnail.src = song.thumbnail;
  overlayTitle.textContent = song.title;
  overlayArtist.textContent = song.artist;
  overlayFav.classList.toggle("favorited", isFavorite(song));
}

// Collapse Overlay
overlayClose.addEventListener("click", () => {
  overlay.classList.add("hidden");
});

// Open overlay when player bar clicked
playerBar.addEventListener("click", (e) => {
  if (e.target.closest(".player-controls") || e.target === audioPlayer) return;
  if (!audioPlayer.src) return;
  const song = getCurrentSong();
  if (song) openOverlay(song);
});

// Helper to get current song
function getCurrentSong() {
  if (!currentMood) return null;
  return musicLibrary[currentMood]?.[currentSongIndex];
}

// Favorites helper
function isFavorite(song) {
  return musicLibrary.Favorites.some(fav => fav.title === song.title && fav.artist === song.artist);
}



// Toggle favorite from overlay

overlay.classList.remove("hidden"); 
overlayFav.addEventListener("click", async () => {
  const song = getCurrentSong();
  if (!song || !auth.currentUser) return;
  const isFavorited = await toggleFavorite(song, currentMood);
  overlayFav.classList.toggle("favorited", isFavorited);
});


// Collapse overlay on tapping anywhere not inside content
overlay.addEventListener("click", (e) => {
  const isInside = e.target.closest(".overlay-content");
  if (!isInside) {
    overlay.classList.add("hidden");
  }
});

overlayShuffle.addEventListener("click", () => {
  isShuffling = !isShuffling;
  overlayShuffle.classList.toggle("active", isShuffling);
});

overlayLoop.addEventListener("click", () => {
  audioPlayer.loop = !audioPlayer.loop;
  overlayLoop.classList.toggle("active", audioPlayer.loop);
});

overlayPrev.addEventListener("click", () => {
  if (!currentMood) return;
  const songs = musicLibrary[currentMood];
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  playSong(songs[currentSongIndex], currentMood, currentSongIndex);
  openOverlay(songs[currentSongIndex]);
});

overlayNext.addEventListener("click", () => {
  if (!currentMood) return;
  const songs = musicLibrary[currentMood];
  currentSongIndex = (currentSongIndex + 1) % songs.length;
  playSong(songs[currentSongIndex], currentMood, currentSongIndex);
  openOverlay(songs[currentSongIndex]);
});

overlayPlay.addEventListener("click", () => {
  if (audioPlayer.paused) {
    audioPlayer.play();
    overlayPlay.textContent = "⏸️";
  } else {
    audioPlayer.pause();
    overlayPlay.textContent = "▶️";
  }
});

// Player Bar Toggle
playerBar.addEventListener("click", (e) => {
  if (e.target.closest(".player-controls") || e.target === audioPlayer) return;
  playerBar.classList.toggle("expanded");
});

// Shuffle Toggle
shuffleToggle.addEventListener("click", () => {
  isShuffling = !isShuffling;
  shuffleToggle.classList.toggle("active", isShuffling);
});

// Loop Toggle
loopToggle.addEventListener("click", () => {
  audioPlayer.loop = !audioPlayer.loop;
  loopToggle.classList.toggle("active", audioPlayer.loop);
});

// Next/Prev Buttons
document.getElementById("prev-song").addEventListener("click", () => {
  if (!currentMood) return;
  const songs = musicLibrary[currentMood];
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  playSong(songs[currentSongIndex], currentMood, currentSongIndex);
});

document.getElementById("next-song").addEventListener("click", () => {
  if (!currentMood) return;
  const songs = musicLibrary[currentMood];
  if (isShuffling) {
    currentSongIndex = Math.floor(Math.random() * songs.length);
  } else {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
  }
  playSong(songs[currentSongIndex], currentMood, currentSongIndex);
});

// Auto-play next song
audioPlayer.addEventListener("ended", () => {
  if (audioPlayer.loop) return;
  if (!currentMood) return;
  const songs = musicLibrary[currentMood];
  if (isShuffling) {
    currentSongIndex = Math.floor(Math.random() * songs.length);
  } else {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
  }
  playSong(songs[currentSongIndex], currentMood, currentSongIndex);
});

// Setup Sign Out
setupSignOut();

// Bottom nav switching
const navButtons = document.querySelectorAll("#bottom-nav .nav-btn");
const navContent = document.getElementById("nav-content");
const mainContent = document.querySelector("main");

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Highlight the active tab
    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const tab = btn.getAttribute("data-tab");

    if (tab === "search") {
      navContent.innerHTML = `<p style="text-align:center;font-size:16px;margin-top:20px;">🔍 Search feature coming soon.</p>`;
      navContent.classList.remove("hidden");
      mainContent.classList.add("hidden");
    } else if (tab === "library") {
      navContent.classList.add("hidden");
      mainContent.classList.remove("hidden");
      moodButtons.innerHTML = ""; // remove mood buttons
      showPlaylist("Favorites");
    } else {
      // tab === "home"
      navContent.classList.add("hidden");
      mainContent.classList.remove("hidden");
      initializeMusicPlayer(); // re-initialize moods
      playlistTitle.textContent = "Select a mood to view the playlist";
      songList.innerHTML = "";
    }
  });
});


