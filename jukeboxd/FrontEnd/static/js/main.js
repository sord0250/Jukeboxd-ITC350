const DIRECTUS_URL = "http://64.23.156.15:8055";

// -------------------- AUTH HELPERS --------------------

function getCurrentUserId() {
    return localStorage.getItem("user_id");
}

function getCurrentUsername() {
    return localStorage.getItem("username");
}

function isLoggedIn() {
    return Boolean(getCurrentUserId());
}

function requireLogin() {
    if (!isLoggedIn()) {
        window.location.href = "/login";
        return false;
    }
    return true;
}

function logoutUser() {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("user_email");
    window.location.href = "/login";
}

// -------------------- API CALLS --------------------

async function fetchSearch(query) {
    const response = await fetch("/api/search?q=" + encodeURIComponent(query));
    return await response.json();
}

async function fetchFeedReviews() {
    const response = await fetch("/api/song_reviews");
    return await response.json();
}

async function fetchUserReviews() {
    const userId = getCurrentUserId();
    const url = userId ? `/api/user_reviews?user_id=${encodeURIComponent(userId)}` : "/api/user_reviews";
    const response = await fetch(url);
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
                ${(entry.review_type || "").toUpperCase()}
                ${entry.album_name ? " • " + entry.album_name : ""}
            </p>

            <p style="font-size: 12px; opacity: 0.7;">
                ❤️ ${entry.num_likes || 0}
            </p>
        </button>
    `;
}

function createProfileReviewCard(entry) {
    const headline =
        entry.S_Name ||
        entry.AL_Name ||
        entry.ART_Name ||
        entry.title ||
        "Untitled Review";

    return `
        <article class="profile_review_card">
            <h3 class="profile_review_headline">${headline}</h3>
            <p class="profile_review_body">${entry.R_Text || entry.review_text || ""}</p>
            <span>⭐ ${entry.R_Rating || entry.review_rating || ""}</span>
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

        count.textContent = `${results.length} match${results.length === 1 ? "" : "es"}`;

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

    try {
        const response = await fetch("/api/feed");
        const reviews = await response.json();

        feedList.innerHTML = reviews
            .map((entry, index) => createFeedCard(entry, index))
            .join("");
    } catch (err) {
        console.error("Feed load error:", err);
    }
}

// -------------------- PROFILE PAGE --------------------

async function initProfilePage() {
    const profileReviewList = document.getElementById("profile-review-list");
    if (!profileReviewList) return;

    if (!requireLogin()) return;

    try {
        const response = await fetch("/api/user_reviews");
        const reviews = await response.json();

        profileReviewList.innerHTML = reviews.map(createProfileReviewCard).join("");
    } catch (err) {
        console.error("Profile load error:", err);
    }
}

// -------------------- ADD REVIEW PAGE --------------------

function initAddPage() {
    const form = document.getElementById("add-review-form");
    if (!form) return;

    if (!requireLogin()) return;

    const input = document.getElementById("review-search-input");
    const resultsContainer = document.getElementById("review-search-results");
    const count = document.getElementById("review-search-count");
    const selectedLabel = document.getElementById("selected-review-item");
    const ratingInput = document.getElementById("review-rating-input");
    const ratingStatus = document.getElementById("rating-status");
    const reviewText = document.getElementById("review-text");
    const message = document.getElementById("add-form-message");
    const ratingButtons = Array.from(document.querySelectorAll(".rating_star"));

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

        count.textContent = `${results.length} match${results.length === 1 ? "" : "es"}`;

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
            id: card.dataset.itemId,
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

        const userId = getCurrentUserId();
        const username = getCurrentUsername();

        if (!userId || !username) {
            message.textContent = "Please log in again.";
            window.location.href = "/login";
            return;
        }

        const reviewData = {
            R_Text: reviewText.value.trim(),
            R_Rating: Number(ratingInput.value),
            U_ID: Number(userId),
            U_Username: username,
            R_TimeCreated: new Date().toISOString()
        };

        if (selectedItem.type === "song") {
            reviewData.S_ID = Number(selectedItem.id);
        }
        if (selectedItem.type === "album") {
            reviewData.AL_ID = Number(selectedItem.id);
        }
        if (selectedItem.type === "artist") {
            reviewData.ART_ID = Number(selectedItem.id);
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
                ratingStatus.textContent = "No rating selected yet";
                ratingButtons.forEach((button) => button.classList.remove("is_active"));
                resultsContainer.innerHTML = "";
                count.textContent = "Start typing to search";
            } else {
                message.textContent = data?.errors?.[0]?.message || "Could not submit review.";
            }
            
        const results = await fetchSearch(normalizedQuery);
        console.log("Search results:", results);

        } catch (err) {
            console.error(err);
            message.textContent = "Server error. See console.";
        }
    });

    updateSelectedLabel();
}

// -------------------- REGISTER PAGE --------------------

async function registerUser(firstName, lastName, username, email, password) {
    const response = await fetch("/api/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            firstName,
            lastName,
            username,
            email,
            password
        })
    });

    return response.ok;
}

function initRegisterPage() {
    const form = document.getElementById("register-form");
    const message = document.getElementById("register-message");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const firstName = document.getElementById("register-fname").value;
        const lastName = document.getElementById("register-lname").value;
        const username = document.getElementById("register-username").value;
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;

        const success = await registerUser(firstName, lastName, username, email, password);

        if (success) {
            message.textContent = "Account created! Logging in...";

            const loginSuccess = await loginUser(email, password);

            if (loginSuccess) {
                window.location.href = "/";
            }
        } else {
            message.textContent = "Could not create account.";
        }
    });
}

// -------------------- LOGIN PAGE --------------------

async function loginUser(email, password) {
    const response = await fetch("/api/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });

    const data = await response.json();

    if (data.success) {
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("username", data.username);
        localStorage.setItem("user_email", data.email);
        return true;
    }

    return false;
}

function initLoginPage() {
    const form = document.getElementById("login-form");
    const message = document.getElementById("login-message");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        if (!email || !password) {
            message.textContent = "Please enter your email and password.";
            return;
        }

        const success = await loginUser(email, password);

        if (success) {
            message.textContent = "Login successful!";
            window.location.href = "/";
        } else {
            message.textContent = "Invalid email or password.";
        }
    });
}

// -------------------- PROFILE LOGOUT BUTTON --------------------

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("profile_action_button_logout")) {
        logoutUser();
    }
});

// -------------------- NAVBAR ACCOUNT AREA --------------------

function initNavbarAccount() {
    const dropdown = document.getElementById("nav-account-dropdown");
    if (!dropdown) return;

    const userId = getCurrentUserId();

    if (userId) {
        dropdown.innerHTML = `
            <a class="nav-link nav-dropdown-link" href="/login" id="logout-button" aria-label="Logout">
                <img class="nav-icon" src="/static/img/jb_logout.png" alt="logout">
            </a>
        `;

        const logoutButton = document.getElementById("logout-button");
        if (logoutButton) {
            logoutButton.addEventListener("click", (e) => {
                e.preventDefault();
                logoutUser();
            });
        }
    } else {
        dropdown.innerHTML = `
            <a class="nav-link nav-dropdown-link" href="/login" aria-label="Login">
                <img class="nav-icon" src="/static/img/jb_login.png" alt="login">
            </a>
            <a class="nav-link nav-dropdown-link" href="/register" aria-label="Register">
                <img class="nav-icon" src="/static/img/jb_register.png" alt="register">
            </a>
        `;
    }
}

// -------------------- PAGE INITIALIZER --------------------

document.addEventListener("DOMContentLoaded", () => {
    initNavbarAccount();
    initHomeFeed();
    initProfilePage();
    initSearchPage();
    initAddPage();
    initLoginPage();
    initRegisterPage();
});