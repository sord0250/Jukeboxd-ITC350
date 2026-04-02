// -------------------- API CALLS --------------------

async function fetchSearch(query) {
    const response = await fetch("/api/search?q=" + query);
    return await response.json();
}

async function fetchFeedReviews() {
    const response = await fetch("/api/song_reviews");
    return await response.json();
}

async function fetchUserReviews() {
    const response = await fetch("/api/user_reviews");
    return await response.json();
}


// -------------------- CARD BUILDERS --------------------

function createSearchCard(item) {
    return `
        <button class="search_card" type="button">
            <div class="search_card_copy">
                <p class="search_card_type">${item.type}</p>
                <h2 class="search_card_title">${item.title}</h2>
            </div>
        </button>
    `;
}

function createFeedCard(entry, index = 0) {
    return `
        <button 
            class="detail_review_card" 
            type="button" 
            data-item-id="${entry.review_id}" 
            data-review-index="${index}"
        >
            <div class="detail_review_head">
                <div class="detail_review_identity">
                    <img 
                        class="detail_review_avatar" 
                        src="/static/img/jb_profile_pic.png" 
                        alt="user"
                    >
                    <span class="detail_review_username">user</span>
                </div>
                <span class="detail_review_rating">⭐ ${entry.review_rating}</span>
            </div>

            <h3 class="detail_review_title">
                ${entry.title}
            </h3>

            <p class="detail_review_snippet">
                ${entry.review_text}
            </p>

            <p style="font-size: 12px; opacity: 0.7;">
                ${entry.review_type.toUpperCase()}
                ${entry.album_name ? " • " + entry.album_name : ""}
            </p>

            <p style="font-size: 12px; opacity: 0.7;">
                ❤️ ${entry.num_likes}
            </p>
        </button>
    `;
}

function createProfileReviewCard(entry) {
    return `
        <article class="profile_review_card">
            <h3 class="profile_review_headline">${entry.S_Name}</h3>
            <p class="profile_review_body">${entry.R_Text}</p>
            <span>⭐ ${entry.R_Rating}</span>
        </article>
    `;
}


// -------------------- SEARCH PAGE --------------------

function initSearchPage() {
    const input = document.getElementById("search-input");
    const resultsContainer = document.getElementById("search-results");
    const count = document.getElementById("search-count");

    if (!input || !resultsContainer || !count) return;

    async function renderResults(query = "") {
        if (!query) {
            resultsContainer.innerHTML = "";
            count.textContent = "0 results";
            return;
        }

        const results = await fetchSearch(query);

        count.textContent = `${results.length} result${results.length === 1 ? "" : "s"}`;

        if (!results.length) {
            resultsContainer.innerHTML = `
                <div class="search_empty">
                    <h2>No matches yet</h2>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = results.map(createSearchCard).join("");
    }

    input.addEventListener("input", (event) => {
        renderResults(event.target.value);
    });
}


// -------------------- HOME FEED --------------------

async function initHomeFeed() {
    const feedList = document.getElementById("feed-list");
    if (!feedList) return;

    const response = await fetch("/api/feed");
    const reviews = await response.json();

    feedList.innerHTML = reviews
        .map((entry, index) => createFeedCard(entry, index))
        .join("");
}


// -------------------- PROFILE PAGE --------------------

async function initProfilePage() {
    const profileReviewList = document.getElementById("profile-review-list");
    if (!profileReviewList) return;

    const response = await fetch("/api/user_reviews");
    const reviews = await response.json();

    profileReviewList.innerHTML = reviews.map(createProfileReviewCard).join("");
}


// -------------------- PAGE INITIALIZER --------------------

document.addEventListener("DOMContentLoaded", () => {
    initHomeFeed();
    initProfilePage();
    initSearchPage();
});