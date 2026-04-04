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
    const profileUsername = document.body.dataset.username;
    const storedUsername = getCurrentUsername();
    const username = profileUsername || storedUsername;
    const url = username
        ? `/api/user_reviews?username=${encodeURIComponent(username)}`
        : "/api/user_reviews";
    const response = await fetch(url);
    return await response.json();
}

async function setReviewLike(reviewId, shouldLike) {
    const response = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/like`, {
        method: shouldLike ? "POST" : "DELETE"
    });
    const data = await response.json().catch(() => ({}));

    return {
        success: response.ok && Boolean(data.success),
        likes: Number(data.likes || 0),
        liked: Boolean(data.liked),
        message: data.message || (shouldLike ? "Could not like review." : "Could not unlike review.")
    };
}

let allFeedReviews = [];
let activeFeedFilter = "all";
let visibleFeedCount = 6;
const FEED_PAGE_SIZE = 6;

function getLikedReviewStorageKey() {
    const username = getCurrentUsername();
    return username ? `liked_reviews:${username}` : null;
}

function getLikedReviewIds() {
    const storageKey = getLikedReviewStorageKey();
    if (!storageKey) {
        return [];
    }

    try {
        const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.error("Could not parse liked reviews:", err);
        return [];
    }
}

function hasLikedReview(reviewId) {
    return getLikedReviewIds().includes(String(reviewId));
}

function storeLikedReview(reviewId) {
    const storageKey = getLikedReviewStorageKey();
    if (!storageKey) {
        return;
    }

    const likedReviewIds = new Set(getLikedReviewIds());
    likedReviewIds.add(String(reviewId));
    localStorage.setItem(storageKey, JSON.stringify(Array.from(likedReviewIds)));
}

function removeLikedReview(reviewId) {
    const storageKey = getLikedReviewStorageKey();
    if (!storageKey) {
        return;
    }

    const likedReviewIds = getLikedReviewIds().filter((id) => id !== String(reviewId));
    localStorage.setItem(storageKey, JSON.stringify(likedReviewIds));
}

function updateFeedReviewLikeCount(reviewId, likeCount) {
    allFeedReviews = allFeedReviews.map((entry) => {
        if (String(entry.review_id) !== String(reviewId)) {
            return entry;
        }

        return {
            ...entry,
            num_likes: likeCount,
            review_num_likes: likeCount,
            R_NumOfLikes: likeCount
        };
    });
}

function updateReviewLikeCountInList(reviews, reviewId, likeCount) {
    return reviews.map((entry) => {
        if (String(entry.review_id) !== String(reviewId)) {
            return entry;
        }

        return normalizeFeedReview({
            ...entry,
            num_likes: likeCount,
            review_num_likes: likeCount,
            R_NumOfLikes: likeCount
        });
    });
}

function getReviewLikeCount(entry) {
    const rawLikeCount =
        entry?.num_likes ??
        entry?.review_num_likes ??
        entry?.R_NumOfLikes ??
        0;

    const parsedLikeCount = Number(rawLikeCount);
    return Number.isFinite(parsedLikeCount) ? parsedLikeCount : 0;
}

function normalizeFeedReview(entry) {
    return {
        ...entry,
        num_likes: getReviewLikeCount(entry)
    };
}

function getReviewArtwork(entry) {
    const fallbackArtwork = entry?.review_type === "artist"
        ? "/static/img/jb_record.png"
        : "/static/img/jb_albumcover.png";
    const artworkTitle =
        entry?.artwork_alt ||
        entry?.album_name ||
        entry?.title ||
        "Review";

    return {
        src: entry?.artwork_url || fallbackArtwork,
        alt: `${artworkTitle} artwork`
    };
}

function bindReviewLikeHandler(container, getReviews, setReviews, rerenderReviews) {
    if (!container) {
        return;
    }

    container.addEventListener("click", async (event) => {
        const likeButton = event.target.closest("[data-like-review-id]");
        if (!likeButton) {
            return;
        }

        event.preventDefault();

        if (!requireLogin()) {
            return;
        }

        if (likeButton.dataset.isPending === "true") {
            return;
        }

        const reviewId = likeButton.dataset.likeReviewId;
        if (!reviewId) {
            return;
        }

        const shouldLike = !hasLikedReview(reviewId);
        likeButton.dataset.isPending = "true";

        try {
            const result = await setReviewLike(reviewId, shouldLike);

            if (!result.success) {
                alert(result.message);
                return;
            }

            if (result.liked) {
                storeLikedReview(reviewId);
            } else {
                removeLikedReview(reviewId);
            }

            updateFeedReviewLikeCount(reviewId, result.likes);
            setReviews(updateReviewLikeCountInList(getReviews(), reviewId, result.likes));
            rerenderReviews();
        } catch (err) {
            console.error("Like error:", err);
            alert("Could not update likes right now.");
        } finally {
            delete likeButton.dataset.isPending;
        }
    });
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

function createFeedCard(entry, index = 0) {
    const likedState = hasLikedReview(entry.review_id);
    const likeCount = getReviewLikeCount(entry);
    const artwork = getReviewArtwork(entry);

    return `
        <article
            class="detail_review_card"
            data-item-id="${entry.review_id}"
            data-review-index="${index}"
        >
            <div class="detail_review_head">
                <div class="detail_review_identity">
                    <img class="detail_review_avatar" src="/static/img/jb_profile_pic.png" alt="user">
                    <span class="detail_review_username">${entry.username || "user"}</span>
                </div>
                <span class="detail_review_rating">&#9733; ${entry.review_rating}</span>
            </div>

            <div class="detail_review_body_row">
                <img class="detail_review_artwork" src="${artwork.src}" alt="${artwork.alt}">

                <div class="detail_review_copy">
                    <h3 class="detail_review_title">${entry.title}</h3>

                    <p class="detail_review_snippet">${entry.review_text}</p>
                </div>
            </div>

            <div class="detail_review_footer">
                <p class="detail_review_meta">
                    ${(entry.review_type || "").toUpperCase()}
                    ${entry.album_name ? " &middot; " + entry.album_name : ""}
                </p>

                <button
                    class="detail_review_like_button${likedState ? " is-liked" : ""}"
                    type="button"
                    data-like-review-id="${entry.review_id}"
                    aria-pressed="${likedState}"
                    aria-label="${likedState ? "Unlike review" : "Like review"}"
                >
                    <span class="detail_review_like_icon" aria-hidden="true">&hearts;</span>
                    <span class="detail_review_like_count">${likeCount}</span>
                </button>
            </div>
        </article>
    `;
}

function formatMemberSince(value) {
    if (!value) {
        return "Unknown";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    }).format(parsed);
}

// -------------------- SEARCH PAGE --------------------

function initSearchPage() {
    const input = document.getElementById("search-input");
    const resultsContainer = document.getElementById("search-results");
    const count = document.getElementById("search-count");

    if (!input || !resultsContainer || !count) return;
    if (!requireLogin()) return;

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
    const feedScrollTrigger = document.getElementById("feed-scroll-trigger");
    const filterButtons = Array.from(document.querySelectorAll(".feed_filter_button"));
    if (!feedList) return;

    function normalizeFeedType(value) {
        return String(value || "").trim().toLowerCase();
    }

    function getFilteredReviews() {
        if (activeFeedFilter === "all") {
            return allFeedReviews;
        }

        return allFeedReviews.filter((entry) => normalizeFeedType(entry.review_type) === activeFeedFilter);
    }

    function updateFilterButtons() {
        filterButtons.forEach((button) => {
            const isActive = button.dataset.feedFilter === activeFeedFilter;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });
    }

    function hasMoreReviews() {
        return visibleFeedCount < getFilteredReviews().length;
    }

    function loadMoreReviews() {
        if (!hasMoreReviews()) {
            return;
        }

        visibleFeedCount += FEED_PAGE_SIZE;
        renderFeed();
    }

    function maybeLoadMoreOnScroll() {
        if (!feedScrollTrigger || !hasMoreReviews()) {
            return;
        }

        const triggerTop = feedScrollTrigger.getBoundingClientRect().top;
        const preloadOffset = 120;

        if (triggerTop <= window.innerHeight + preloadOffset) {
            loadMoreReviews();
        }
    }

    function renderFeed() {
        const reviews = getFilteredReviews();

        if (!reviews.length) {
            feedList.innerHTML = `
                <article class="detail_review_card">
                    <h3 class="detail_review_title">No reviews yet</h3>
                    <p class="detail_review_snippet">There are no ${activeFeedFilter === "all" ? "" : activeFeedFilter + " "}reviews to show right now.</p>
                </article>
            `;
            return;
        }

        feedList.innerHTML = reviews
            .slice(0, visibleFeedCount)
            .map((entry, index) => createFeedCard(entry, index))
            .join("");
        window.requestAnimationFrame(maybeLoadMoreOnScroll);
    }

    bindReviewLikeHandler(
        feedList,
        () => allFeedReviews,
        (reviews) => {
            allFeedReviews = reviews;
        },
        renderFeed
    );

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            activeFeedFilter = button.dataset.feedFilter || "all";
            visibleFeedCount = FEED_PAGE_SIZE;
            updateFilterButtons();
            renderFeed();
        });
    });

    if (feedScrollTrigger && "IntersectionObserver" in window) {
        const feedObserver = new IntersectionObserver((entries) => {
            const triggerIsVisible = entries.some((entry) => entry.isIntersecting);

            if (triggerIsVisible) {
                loadMoreReviews();
            }
        }, {
            rootMargin: "0px 0px 120px 0px"
        });

        feedObserver.observe(feedScrollTrigger);
    } else {
        window.addEventListener("scroll", maybeLoadMoreOnScroll, { passive: true });
    }

    window.addEventListener("resize", maybeLoadMoreOnScroll);

    try {
        const response = await fetch("/api/feed");
        const payload = await response.json();
        const reviews = Array.isArray(payload) ? payload : payload.data || [];
        allFeedReviews = reviews.map(normalizeFeedReview);
        visibleFeedCount = FEED_PAGE_SIZE;
        updateFilterButtons();
        renderFeed();
    } catch (err) {
        console.error("Feed load error:", err);
    }
}

// -------------------- PROFILE PAGE --------------------

async function initProfilePage() {
    const profileReviewList = document.getElementById("profile-review-list");
    const reviewCount = document.getElementById("profile-reviews");
    if (!profileReviewList) return;

    if (!requireLogin()) return;

    let profileReviews = [];

    function renderProfileReviews() {
        if (reviewCount) {
            reviewCount.textContent = profileReviews.length;
        }

        if (!profileReviews.length) {
            profileReviewList.innerHTML = `
                <article class="detail_review_card">
                    <h3 class="detail_review_title">No reviews yet</h3>
                    <p class="detail_review_snippet">This user has not posted any reviews yet.</p>
                </article>
            `;
            return;
        }

        profileReviewList.innerHTML = profileReviews.map(createFeedCard).join("");
    }

    bindReviewLikeHandler(
        profileReviewList,
        () => profileReviews,
        (reviews) => {
            profileReviews = reviews;
        },
        renderProfileReviews
    );

    try {
        const payload = await fetchUserReviews();
        const reviews = payload.data || payload;
        profileReviews = reviews.map(normalizeFeedReview);
        renderProfileReviews();
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
            R_NumOfLikes: 0,
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

    const data = await response.json().catch(() => ({}));

    return {
        success: response.ok && Boolean(data.success ?? true),
        message: data.message || (response.ok ? "Account created!" : "Could not create account.")
    };
}

function initRegisterPage() {
    const form = document.getElementById("register-form");
    const message = document.getElementById("register-message");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const firstName = document.getElementById("register-fname").value.trim();
        const lastName = document.getElementById("register-lname").value.trim();
        const username = document.getElementById("register-username").value.trim();
        const email = document.getElementById("register-email").value.trim();
        const password = document.getElementById("register-password").value;

        if (!firstName || !lastName || !username || !email || !password) {
            message.textContent = "Please fill out every field.";
            return;
        }

        if (username.length < 5 || username.length > 12) {
            message.textContent = "Username must be 5-12 characters.";
            return;
        }

        const result = await registerUser(firstName, lastName, username, email, password);

        if (result.success) {
            message.textContent = "Account created! Logging in...";

            const loginSuccess = await loginUser(email, password);

            if (loginSuccess) {
                window.location.href = "/";
            }
        } else {
            message.textContent = result.message;
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
            <a class="nav-link nav-dropdown-link" href="/login" id="logout-button" aria-label="Logout" title="Logout" data-nav-hint="Logout">
                <img class="nav-icon" src="/static/img/jb_logout.svg" alt="logout">
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
            <a class="nav-link nav-dropdown-link" href="/login" aria-label="Login" title="Login" data-nav-hint="Login">
                <img class="nav-icon" src="/static/img/jb_login.svg" alt="login">
            </a>
            <a class="nav-link nav-dropdown-link" href="/register" aria-label="Register" title="Register" data-nav-hint="Register">
                <img class="nav-icon" src="/static/img/jb_register.svg" alt="register">
            </a>
        `;
    }
}

// -------------------- LOAD PROFILE DATA --------------------

async function loadProfile() {
    const userId = document.body.dataset.userId;
    if (!userId) return;

    const res = await fetch(`http://64.23.156.15:8055/items/USER/${userId}`);
    const json = await res.json();
    const user = json.data;

    document.getElementById("profile-name").textContent = user.U_Username;
    document.getElementById("profile-handle").textContent = "@" + user.U_Username;
    document.getElementById("profile-genre").textContent = user.U_FavoriteGenre;
    document.getElementById("profile-member").textContent = formatMemberSince(
        user.U_DateCreated || user.date_created
    );
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
    loadProfile();
});
