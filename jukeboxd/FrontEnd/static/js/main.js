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

function createDetailContent(item) {
    const meta = [item.subtitle, item.year, item.genre].filter(Boolean).join(" • ");
    const reviewsMarkup = item.reviews.length
        ? item.reviews.map((review, index) => createReviewPreview(review, item.id, index)).join("")
        : `<p class="detail_empty_reviews">No reviews yet.</p>`;

    return `
        <div class="detail_modal_layout">
            <div class="detail_media_column">
                <img class="detail_cover" src="${item.art}" alt="${item.title}">
            </div>
            <div class="detail_copy_column">
                <p class="detail_meta">${meta}</p>
                <h2 id="detail-title" class="detail_title">${item.title}</h2>
                <p class="detail_artist">${item.artist}</p>
                <p class="detail_description">${item.description}</p>
                <section class="detail_reviews_section">
                    <div class="detail_reviews_heading_row">
                        <h3 class="detail_reviews_heading">Community Reviews</h3>
                        <span class="detail_reviews_count">${item.reviews.length} review${item.reviews.length === 1 ? "" : "s"}</span>
                    </div>
                    <div class="detail_reviews_list">
                        ${reviewsMarkup}
                    </div>
                </section>
            </div>
        </div>
    `;
}

function createReviewModalContent(item, review) {
    const meta = [item.title, item.artist].filter(Boolean).join(" • ");

    return `
        <div class="review_modal_body">
            <p class="review_modal_meta">${meta}</p>
            <div class="review_modal_head">
                <div class="detail_review_identity">
                    <img class="detail_review_avatar" src="${review.avatar}" alt="${review.username}">
                    <span class="detail_review_username">${review.username}</span>
                </div>
                <span class="detail_review_rating">${review.rating}</span>
            </div>
            <h2 id="review-modal-title" class="review_modal_title">${review.headline}</h2>
            <p class="review_modal_copy">${review.body}</p>
        </div>
    `;
}

function filterSearchItems(items, query) {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
        return items;
    }

    return items.filter((item) => {
        const haystack = `${item.title} ${item.artist} ${item.type}`.toLowerCase();
        return haystack.includes(normalizedQuery);
    });
}

function createSelectableSearchListItem(item, isSelected) {
    const meta = item.year ? `${item.subtitle} • ${item.year}` : item.subtitle;
    const selectedClass = isSelected ? " add_result_item_selected" : "";
    const selectedState = isSelected ? "true" : "false";

    return `
        <button class="add_result_item${selectedClass}" type="button" data-item-id="${item.id}" aria-pressed="${selectedState}">
            <span class="add_result_main">
                <span class="add_result_title">${item.title}</span>
                <span class="add_result_artist">${item.artist}</span>
            </span>
            <span class="add_result_meta">${meta}</span>
        </button>
    `;
}

function formatStarRating(value) {
    return "★".repeat(value) + "☆".repeat(5 - value);
}

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

    let selectedItemId = "";

    function getSelectedItem() {
        return mockSearchItems.find((item) => item.id === selectedItemId);
    }

    function updateSelectedLabel() {
        const item = getSelectedItem();

        if (!item) {
            selectedLabel.textContent = "Nothing selected yet";
            return;
        }

        selectedLabel.textContent = `Selected: ${item.title} by ${item.artist}`;
    }

    function renderResults(query = "") {
        const normalizedQuery = query.trim();

        if (!normalizedQuery) {
            count.textContent = "Start typing to search";
            resultsContainer.innerHTML = `
                <div class="add_results_placeholder">
                    <p class="add_results_placeholder_copy">Matching albums, songs, and artists will appear here.</p>
                </div>
            `;
            return;
        }

        const results = filterSearchItems(mockSearchItems, normalizedQuery);

        count.textContent = `${results.length} match${results.length === 1 ? "" : "es"}`;

        if (!results.length) {
            resultsContainer.innerHTML = `
                <div class="add_results_placeholder">
                    <p class="add_results_placeholder_copy">No matches yet. Try an album title, song name, or artist.</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = results
            .map((item) => createSelectableSearchListItem(item, item.id === selectedItemId))
            .join("");
    }

    function setRating(value) {
        ratingInput.value = String(value);
        ratingStatus.textContent = `${value} out of 5 stars selected`;

        ratingButtons.forEach((button) => {
            const buttonValue = Number(button.dataset.ratingValue);
            const isActive = buttonValue <= value;
            button.classList.toggle("is_active", isActive);
            button.setAttribute("aria-pressed", String(buttonValue === value));
        });
    }

    input.addEventListener("input", (event) => {
        renderResults(event.target.value);
    });

    resultsContainer.addEventListener("click", (event) => {
        const card = event.target.closest("[data-item-id]");

        if (!card) {
            return;
        }

        selectedItemId = card.dataset.itemId;
        input.value = getSelectedItem()?.title ?? input.value;
        updateSelectedLabel();
        renderResults(input.value);
        message.textContent = "";
    });

    ratingButtons.forEach((button) => {
        button.addEventListener("click", () => {
            setRating(Number(button.dataset.ratingValue));
            message.textContent = "";
        });
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const selectedItem = getSelectedItem();
        const rating = Number(ratingInput.value);
        const reviewBody = reviewText.value.trim();

        if (!selectedItem) {
            message.textContent = "Pick something to review before submitting.";
            return;
        }

        if (!rating) {
            message.textContent = "Choose a star rating before submitting.";
            return;
        }

        if (!reviewBody) {
            message.textContent = "Write a few thoughts before submitting.";
            return;
        }

        message.textContent = `Review submitted for ${selectedItem.title} with ${formatStarRating(rating)}.`;
        form.reset();
        selectedItemId = "";
        ratingInput.value = "";
        ratingStatus.textContent = "No rating selected yet";
        ratingButtons.forEach((button) => {
            button.classList.remove("is_active");
            button.setAttribute("aria-pressed", "false");
        });
        updateSelectedLabel();
        renderResults("");
    });

    updateSelectedLabel();
    renderResults("");
}

function initHomeFeed() {
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
    initAddPage();
});