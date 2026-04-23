// =====================
// Configuration
// =====================
const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = "API_KEY_GOES_HERE";
//need to make a TMDB account and apply for key in order to get data to flow into website.

// =====================
// DOM Elements
// =====================
const randomizeBtn = document.getElementById("randomizeBtn");
const spinAgainBtn = document.getElementById("spinAgain");
const movieDisplay = document.getElementById("movieDisplay");


const poster = document.getElementById("poster");
const movieTitle = document.getElementById("movieTitle");
const movieDesc = document.getElementById("movieDesc");
const movieRating = document.getElementById("movieRating");
const movieYear = document.getElementById("movieYear");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

// Load history from localStorage
let history = JSON.parse(localStorage.getItem("spinHistory")) || [];

// Display history when page loads
renderHistory();

// Handle click for initial randomization
randomizeBtn.addEventListener("click", () => {
  getMovie(false);
});

// Handle click to spin again with same filters
spinAgainBtn.addEventListener("click", () => {
  getMovie(true);
});

// Main movie retrieval function
async function getMovie(spinAgain) {
  const genre = document.getElementById("genreSelect").value;
  const yearRange = document.getElementById("yearRange").value;
  const actorName = document.getElementById("actorInput").value.trim();

  let yearStart = "";
  let yearEnd = "";

  if (yearRange) {
    [yearStart, yearEnd] = yearRange.split("-");
  }

  let actorID = "";
  if (actorName) {
    actorID = await fetchActorID(actorName);
    if (!actorID) {
      alert("Actor not found!");
      return;
    }
  }

  const baseUrl =
    `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}` +
    `&sort_by=popularity.desc` +
    `&vote_average.gte=5` +
    `&vote_count.gte=50` +
    (genre ? `&with_genres=${genre}` : "") +
    (yearStart ? `&primary_release_date.gte=${yearStart}-01-01` : "") +
    (yearEnd ? `&primary_release_date.lte=${yearEnd}-12-31` : "") +
    (actorID ? `&with_cast=${actorID}` : "");

  // 1️⃣ First request: get total pages
  const firstResponse = await fetch(baseUrl);
  const firstData = await firstResponse.json();

  if (!firstData.results.length) {
    alert("No movies found for these filters.");
    return;
  }

  const totalPages = Math.min(firstData.total_pages, 500);

  let chosen = null;
  let attempts = 0;

  while (!chosen && attempts < 10) {
    attempts++;

    const randomPage = Math.floor(Math.random() * totalPages) + 1;
    const pageResponse = await fetch(`${baseUrl}&page=${randomPage}`);
    const pageData = await pageResponse.json();

    const unseenMovies = pageData.results.filter(
      (m) => !history.some((h) => h.id === m.id)
    );

    if (unseenMovies.length) {
      chosen = unseenMovies[Math.floor(Math.random() * unseenMovies.length)];
    }
  }

  if (!chosen) {
    alert("You've seen too many movies for these filters. Try changing them.");
    return;
  }

  displayMovie(chosen);
  addToHistory(chosen);
}

document.addEventListener("keydown", (event) => {
  // Ignore Enter if user is typing in an input field
  if (event.target.tagName === "INPUT") return;

  if (event.key === "Enter") {
    getMovie(true);
  }
});

// Look up actor ID from actor name
async function fetchActorID(name) {
  const url = `https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${name}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results.length ? data.results[0].id : null;
}

// Display the chosen movie
function displayMovie(movie) {
  document.querySelector(".spin-container").classList.remove("hidden");
  movieDisplay.classList.remove("hidden");

  document.getElementById("moviePlaceholder").style.display = "none";

  poster.src = movie.poster_path
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : "no_poster.png";

  movieTitle.textContent = movie.title;
  movieDesc.textContent = movie.overview || "No description available.";
  movieRating.textContent = `Rating: ⭐ ${movie.vote_average.toFixed(1)}`;
  movieYear.textContent = `Release Year: ${
    movie.release_date?.split("-")[0] || "N/A"
  }`;
}

// Add movie to history
function addToHistory(movie) {
  const entry = {
    id: movie.id,
    title: movie.title,
    poster: movie.poster_path
      ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
      : "no_poster.png",
  };

  history.unshift(entry);
  localStorage.setItem("spinHistory", JSON.stringify(history));
  renderHistory();
}

// Render history list
function renderHistory() {
  if (!history.length) {
    historyList.innerHTML = "<p>No history yet.</p>";
    return;
  }

  historyList.innerHTML = history
    .map(
      (movie) => `
      <div class="history-item">
        <img src="${movie.poster}" alt="${movie.title}" />
        <p>${movie.title}</p>
      </div>
    `
    )
    .join("");
}

// clear history button code
clearHistoryBtn.addEventListener("click", () => {
  const confirmClear = confirm(
    "Are you sure you want to clear your movie history?"
  );
  if (!confirmClear) return;

  history = [];
  localStorage.removeItem("spinHistory");
  renderHistory();
});
