const DIRECTUS_URL = "http://64.23.156.15:8055";

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
                    <img class="detail_review_avatar" src="/static/img/jb_profile_pic.png" alt="user">
                    <span class="detail_review_username">${entry.username || "user"}</span>
                </div>
                <span class="detail_review_rating">⭐ ${entry.review_rating}</span>
            </div>

            <h3 class="detail_review_title">${entry.title}</h3>

            <p class="detail_review_snippet">${entry.review_text}</p>

            <p style="font-size: 12px; opacity: 0.7;">
                ${entry.review_type.toUpperCase()}
                ${entry.album_name ? " • " + entry.album_name : ""}
            </p>

            <p style="font-size: 12px; opacity: 0.7;">
                ❤️ ${entry.num_likes || 0}
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
            resultsContainer.innerHTML = "";
            return;
        }

        const results = await fetchSearch(normalizedQuery);

        count.textContent = `${results.length} matches`;

        resultsContainer.innerHTML = results.map((item) => `
            <button class="search_card"
                data-item-id="${item.id}"
                data-item-type="${item.type}"
                data-item-title="${item.title}">
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

// -------------------- ADD REVIEW PAGE --------------------

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

    if (!form) return;

    let selectedItem = null;

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

        count.textContent = `${results.length} matches`;

        resultsContainer.innerHTML = results.map((item) => `
            <button class="search_card"
                data-item-id="${item.id}"
                data-item-type="${item.type}"
                data-item-title="${item.title}">
                <p>${item.type}</p>
                <h3>${item.title}</h3>
            </button>
        `).join("");
    }

    input.addEventListener("input", (event) => {
        renderResults(event.target.value);
    });

    resultsContainer.addEventListener("click", (event) => {
        const card = event.target.closest(".search_card");
        if (!card) return;

        selectedItem = {
            id: Number(card.dataset.itemId),
            type: card.dataset.itemType,
            title: card.dataset.itemTitle
        };

        console.log("Selected item:", selectedItem);

        input.value = selectedItem.title;
        updateSelectedLabel();
        message.textContent = "";

        resultsContainer.innerHTML = "";
        count.textContent = "Item selected";
    });

    function setRating(value) {
        ratingInput.value = String(value);
        ratingStatus.textContent = `${value} out of 5 stars selected`;

        ratingButtons.forEach((button) => {
            const buttonValue = Number(button.dataset.ratingValue);
            button.classList.toggle("is_active", buttonValue <= value);
        });
    }

    ratingButtons.forEach((button) => {
        button.addEventListener("click", () => {
            setRating(Number(button.dataset.ratingValue));
            message.textContent = "";
        });
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!selectedItem) {
            message.textContent = "Please select a song, album, or artist.";
            return;
        }

        if (!ratingInput.value) {
            message.textContent = "Please select a rating.";
            return;
        }

        if (!reviewText.value.trim()) {
            message.textContent = "Please write a review.";
            return;
        }

        const reviewData = {
            R_Text: reviewText.value.trim(),
            R_Rating: Number(ratingInput.value),
            U_ID: 1,
            U_Username: "AliceS",
            R_TimeCreated: new Date().toISOString()
        };

        if (selectedItem.type === "song") {
            reviewData.S_ID = selectedItem.id;
        }
        if (selectedItem.type === "album") {
            reviewData.AL_ID = selectedItem.id;
        }
        if (selectedItem.type === "artist") {
            reviewData.ART_ID = selectedItem.id;
        }

        console.log("Posting review:", reviewData);

        try {
            const response = await fetch(DIRECTUS_URL + "/items/REVIEW", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reviewData)
            });

            const data = await response.json();
            console.log("Response:", data);

            if (response.ok) {
                message.textContent = "Review submitted!";
                form.reset();
                selectedItem = null;
                updateSelectedLabel();
            } else {
                message.textContent = data.errors[0].message;
            }

        } catch (err) {
            console.error(err);
            message.textContent = "Server error. See console.";
        }
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