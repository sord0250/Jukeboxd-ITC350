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
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
        count.textContent = "Start typing to search";
        resultsContainer.innerHTML = `
            <div class="add_results_placeholder">
                <p class="add_results_placeholder_copy">
                    Matching albums, songs, and artists will appear here.
                </p>
            </div>
        `;
        return;
    }

    const results = await fetchSearch(normalizedQuery);

    count.textContent = `${results.length} match${results.length === 1 ? "" : "es"}`;

    if (!results.length) {
        resultsContainer.innerHTML = `
            <div class="add_results_placeholder">
                <p class="add_results_placeholder_copy">
                    No matches yet.
                </p>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = results.map((item) => `
        <button class="search_card" data-item-id="${item.id}">
            <p>${item.type}</p>
            <h3>${item.title}</h3>
        </button>
    `).join("");
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

// -------------------- ADD THAT DANG SONG ---------------------
function initAddPage() {
    const form = document.getElementById("add-review-form");
    const input = document.getElementById("review-search-input");
    const resultsContainer = document.getElementById("review-search-results");
    const count = document.getElementById("review-search-count");
    const selectedLabel = document.getElementById("selected-review-item");
    const ratingInput = document.getElementById("review-rating-input");
    const ratingStatus = document.getElementById("rating-status");
    const reviewText = document.getElementById("review-text");
    const message = document.getElementById("add-form-message");
    const ratingButtons = Array.from(document.querySelectorAll(".rating_star"));

    if (!form || !input || !resultsContainer || !count || !selectedLabel || !ratingInput || !ratingStatus || !reviewText || !message || !ratingButtons.length) {
        return;
    }

    let selectedItem = null;
    let selectedItemId = "";

    function updateSelectedLabel() {
        if (!selectedItem) {
            selectedLabel.textContent = "Nothing selected yet";
            return;
        }
        selectedLabel.textContent = `Selected: ${selectedItem.title}`;
    }

    async function renderResults(query = "") {
        const normalizedQuery = query.trim();

        if (!normalizedQuery) {
            count.textContent = "Start typing to search";
            resultsContainer.innerHTML = "";
            return;
        }

        const results = await fetchSearch(normalizedQuery);

        count.textContent = `${results.length} match${results.length === 1 ? "" : "es"}`;

        resultsContainer.innerHTML = results.map((item) => `
            <button class="search_card" data-item-id="${item.id}">
                <p>${item.type}</p>
                <h3>${item.title}</h3>
            </button>
        `).join("");
    }

    function setRating(value) {
        ratingInput.value = String(value);
        ratingStatus.textContent = `${value} out of 5 stars selected`;

        ratingButtons.forEach((button) => {
            const buttonValue = Number(button.dataset.ratingValue);
            const isActive = buttonValue <= value;
            button.classList.toggle("is_active", isActive);
        });
    }

    input.addEventListener("input", (event) => {
        renderResults(event.target.value);
    });

    resultsContainer.addEventListener("click", (event) => {
        const card = event.target.closest("[data-item-id]");
        if (!card) return;

        selectedItemId = card.dataset.itemId;
        selectedItem = {
            id: card.dataset.itemId,
            title: card.querySelector("h3").textContent
        };

        input.value = selectedItem.title;
        updateSelectedLabel();
        message.textContent = "";

        // CLOSE SEARCH RESULTS
        resultsContainer.innerHTML = "";
        count.textContent = "Item selected";
    });

    ratingButtons.forEach((button) => {
        button.addEventListener("click", () => {
            setRating(Number(button.dataset.ratingValue));
            message.textContent = "";
        });
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const rating = Number(ratingInput.value);
        const reviewBody = reviewText.value.trim();

        if (!selectedItemId) {
            message.textContent = "Pick something to review before submitting.";
            return;
        }

        if (!rating) {
            message.textContent = "Choose a star rating before submitting.";
            return;
        }

        if (!reviewBody) {
            message.textContent = "Write a review before submitting.";
            return;
        }

        await fetch("/api/add_review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                item_id: selectedItemId,
                rating: rating,
                review_text: reviewBody
            })
        });

        message.textContent = "Review submitted!";
        form.reset();
        selectedItem = null;
        selectedItemId = "";
        updateSelectedLabel();
        renderResults("");
    });

    updateSelectedLabel();
}


// -------------------- PAGE INITIALIZER --------------------

document.addEventListener("DOMContentLoaded", () => {
    initHomeFeed();
    initProfilePage();
    initSearchPage();
    initAddPage();
});