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
    const data = await response.json().catch(() => ([]));
    if (Array.isArray(data)) {
        return data;
    }
    if (Array.isArray(data?.data)) {
        return data.data;
    }
    return [];
}

async function fetchSearchRelatedReviews(itemType, itemId, limit = 4) {
    const params = new URLSearchParams({
        type: itemType,
        id: itemId,
        limit: String(limit)
    });
    const response = await fetch(`/api/search_related_reviews?${params.toString()}`);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Could not load related reviews.");
    }

    return data;
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

function formatFeedRatingDisplay(value) {
    const numericRating = Number(value);
    if (!Number.isFinite(numericRating)) {
        return { stars: "", score: "" };
    }

    const starCount = Math.max(1, Math.min(5, Math.round(numericRating / 2)));
    return {
        stars: `${"★".repeat(starCount)}${"☆".repeat(5 - starCount)}`,
        score: `${starCount}/5`
    };
}

function createFeedCard(entry, index = 0) {
    const likedState = hasLikedReview(entry.review_id);
    const likeCount = getReviewLikeCount(entry);
    const artwork = getReviewArtwork(entry);
    const reviewType = String(entry.review_type || "").toLowerCase();
    const isAlbumReview = reviewType === "album";
    const ratingDisplay = formatFeedRatingDisplay(entry.review_rating);
    const supportingLine = (reviewType === "song" || reviewType === "album")
        ? (entry.artist_names || "No Artist Found")
        : "";

    return `
        <article
            class="detail_review_card${isAlbumReview ? " detail_review_card_album" : ""}"
            data-item-id="${entry.review_id}"
            data-review-index="${index}"
        >
            <div class="detail_review_head">
                <div class="detail_review_identity">
                    <img class="detail_review_avatar" src="/static/img/jb_profile_pic.png" alt="user">
                    <span class="detail_review_username">${entry.username || "user"}</span>
                </div>
                <div class="detail_review_rating_block">
                    <span class="detail_review_rating_stars">${ratingDisplay.stars}</span>
                    <span class="detail_review_rating_score">${ratingDisplay.score}</span>
                </div>
            </div>

            <div class="detail_review_body_row">
                <div class="detail_review_copy">
                    <h3 class="detail_review_title">${entry.title}</h3>
                    ${supportingLine ? `<p class="detail_review_supporting">${supportingLine}</p>` : ""}
                    <p class="detail_review_snippet">${entry.review_text}</p>

                    <div class="detail_review_footer">
                        <div class="detail_review_footer_left">
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

                            <p class="detail_review_meta">
                                ${(entry.review_type || "").toUpperCase()}
                            </p>
                        </div>

                        <div class="detail_review_footer_right">
                            <span class="detail_review_rating_stars">${ratingDisplay.stars}</span>
                            <span class="detail_review_rating_score">${ratingDisplay.score}</span>
                        </div>
                    </div>
                </div>

                <div class="detail_review_media${isAlbumReview ? " detail_review_media_album" : ""}">
                    ${isAlbumReview ? `<img class="detail_review_vinyl" src="/static/img/jb_record.png" alt="">` : ""}
                    <img class="detail_review_artwork" src="${artwork.src}" alt="${artwork.alt}">
                </div>
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
    const detailModal = document.getElementById("detail-modal");
    const detailClose = document.getElementById("detail-close");
    const detailContent = document.getElementById("detail-content");

    if (!input || !resultsContainer || !count) return;
    if (!requireLogin()) return;

    let activeSearchItem = null;
    let activeRelatedReviews = [];
    let activeRelatedReviewCount = 0;
    let relatedReviewsLoading = false;
    let relatedReviewsError = "";
    let activeReviewRequestId = 0;
    let currentSearchResults = [];

    function normalizeSearchItemType(value) {
        const normalizedValue = String(value || "").trim().toLowerCase();

        if (normalizedValue.startsWith("song")) {
            return "song";
        }
        if (normalizedValue.startsWith("album")) {
            return "album";
        }
        if (normalizedValue.startsWith("artist")) {
            return "artist";
        }

        return normalizedValue || "item";
    }

    function formatSearchItemType(value) {
        const normalizedType = normalizeSearchItemType(value);
        return normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1);
    }

    function getSearchFallbackArtwork(itemType) {
        return normalizeSearchItemType(itemType) === "artist"
            ? "/static/img/jb_record.png"
            : "/static/img/jb_albumcover.png";
    }

    function getSearchItemArtwork(item, fallbackEntry = null) {
        if (item?.artwork_url) {
            return {
                src: item.artwork_url,
                alt: item.artwork_alt || `${item.title || "Selected item"} artwork`
            };
        }

        if (fallbackEntry) {
            return getReviewArtwork(fallbackEntry);
        }

        return {
            src: getSearchFallbackArtwork(item?.type),
            alt: `${item?.title || "Selected item"} artwork`
        };
    }

    function openDetailModal() {
        if (!detailModal) {
            return;
        }

        detailModal.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function closeDetailModal() {
        if (!detailModal) {
            return;
        }

        detailModal.hidden = true;
        document.body.style.removeProperty("overflow");
    }

    function renderSearchDetailModal() {
        if (!detailContent || !activeSearchItem) {
            return;
        }

        const itemType = normalizeSearchItemType(activeSearchItem.type);
        const itemTypeLabel = formatSearchItemType(itemType);
        const leadReview = activeRelatedReviews[0];
        const artwork = getSearchItemArtwork(activeSearchItem, leadReview);
        const reviewCountLabel = relatedReviewsLoading
            ? "Loading reviews..."
            : relatedReviewsError
                ? "Could not load reviews"
                : activeRelatedReviewCount > activeRelatedReviews.length
                    ? `Showing ${activeRelatedReviews.length} of ${activeRelatedReviewCount} reviews`
                    : `${activeRelatedReviewCount} review${activeRelatedReviewCount === 1 ? "" : "s"}`;

        let reviewsMarkup = `<p class="detail_empty_reviews">No reviews have been posted for this ${itemType} yet.</p>`;
        if (relatedReviewsLoading) {
            reviewsMarkup = '<p class="detail_empty_reviews">Loading the most liked reviews for this selection...</p>';
        } else if (relatedReviewsError) {
            reviewsMarkup = `<p class="detail_empty_reviews">${relatedReviewsError}</p>`;
        } else if (activeRelatedReviews.length) {
            reviewsMarkup = activeRelatedReviews
                .map((entry, index) => createFeedCard(entry, index))
                .join("");
        }

        detailContent.innerHTML = `
            <div class="detail_modal_layout">
                <div class="detail_media_column">
                    <img class="detail_cover" src="${artwork.src}" alt="${artwork.alt}">
                </div>
                <div class="detail_copy_column">
                    <p class="detail_meta">${itemTypeLabel}</p>
                    <h2 id="detail-title" class="detail_title">${activeSearchItem.title}</h2>
                    <p class="detail_description">Most liked community reviews for this ${itemType}.</p>

                    <section class="detail_reviews_section">
                        <div class="detail_reviews_heading_row">
                            <h3 class="detail_reviews_heading">Top reviews</h3>
                            <span class="detail_reviews_count">${reviewCountLabel}</span>
                        </div>
                        <div class="detail_reviews_list">
                            ${reviewsMarkup}
                        </div>
                    </section>
                </div>
            </div>
        `;
    }

    bindReviewLikeHandler(
        detailContent,
        () => activeRelatedReviews,
        (reviews) => {
            activeRelatedReviews = reviews;
        },
        renderSearchDetailModal
    );

    async function renderResults(query = "") {
        const normalizedQuery = query.trim();

        if (!normalizedQuery) {
            count.textContent = "Start typing to search";
            currentSearchResults = [];
            resultsContainer.innerHTML = "";
            return;
        }

        const results = await fetchSearch(normalizedQuery);
        currentSearchResults = Array.isArray(results) ? results : [];

        count.textContent = `${currentSearchResults.length} match${currentSearchResults.length === 1 ? "" : "es"}`;

        if (!currentSearchResults.length) {
            resultsContainer.innerHTML = `
                <article class="search_empty">
                    <h2 class="search_empty_title">No matches found</h2>
                    <p class="search_empty_copy">Try a different song, album, or artist name.</p>
                </article>
            `;
            return;
        }

        resultsContainer.innerHTML = currentSearchResults.map((item) => {
            const itemType = normalizeSearchItemType(item.type);
            const itemTypeLabel = formatSearchItemType(item.type);
            const artwork = getSearchItemArtwork(item);
            const supportingText = item.supporting_text || `Open the most liked reviews for this ${itemType}.`;

            return `
                <button class="search_card"
                    data-item-id="${item.id}"
                    data-item-type="${itemType}">
                    <div class="search_card_media">
                        <img class="search_card_art" src="${artwork.src}" alt="${artwork.alt}">
                    </div>
                    <div class="search_card_copy">
                        <p class="search_card_type">${itemTypeLabel}</p>
                        <h3 class="search_card_title">${item.title}</h3>
                        <p class="search_card_artist">${supportingText}</p>
                    </div>
                </button>
            `;
        }).join("");
    }

    input.addEventListener("input", (event) => {
        renderResults(event.target.value);
    });

    resultsContainer.addEventListener("click", async (event) => {
        const card = event.target.closest(".search_card");
        if (!card) {
            return;
        }

        const selectedItem = currentSearchResults.find((item) => (
            String(item.id) === String(card.dataset.itemId)
            && normalizeSearchItemType(item.type) === normalizeSearchItemType(card.dataset.itemType)
        ));
        activeSearchItem = selectedItem || {
            id: card.dataset.itemId,
            type: normalizeSearchItemType(card.dataset.itemType),
            title: card.querySelector(".search_card_title")?.textContent?.trim() || "Selected item"
        };
        activeRelatedReviews = [];
        activeRelatedReviewCount = 0;
        relatedReviewsError = "";
        relatedReviewsLoading = true;
        openDetailModal();
        renderSearchDetailModal();

        const requestId = ++activeReviewRequestId;

        try {
            const payload = await fetchSearchRelatedReviews(activeSearchItem.type, activeSearchItem.id);
            if (requestId !== activeReviewRequestId) {
                return;
            }

            const reviews = Array.isArray(payload?.data) ? payload.data : [];
            activeRelatedReviews = reviews.map(normalizeFeedReview);
            activeRelatedReviewCount = Number(payload?.total ?? activeRelatedReviews.length);
        } catch (err) {
            if (requestId !== activeReviewRequestId) {
                return;
            }

            console.error("Related review load error:", err);
            relatedReviewsError = err.message || "Could not load related reviews right now.";
        } finally {
            if (requestId === activeReviewRequestId) {
                relatedReviewsLoading = false;
                renderSearchDetailModal();
            }
        }
    });

    detailClose?.addEventListener("click", closeDetailModal);

    detailModal?.addEventListener("click", (event) => {
        if (event.target === detailModal) {
            closeDetailModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && detailModal && !detailModal.hidden) {
            closeDetailModal();
        }
    });
}

// -------------------- HOME FEED --------------------

async function initHomeFeed() {
    const feedList = document.getElementById("feed-list");
    const feedScrollTrigger = document.getElementById("feed-scroll-trigger");
    const backToTopButton = document.getElementById("feed-back-to-top");
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

    function updateBackToTopButton() {
        if (!backToTopButton) {
            return;
        }

        const shouldShowButton = window.scrollY > 320;
        backToTopButton.classList.toggle("is-visible", shouldShowButton);
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

    if (backToTopButton) {
        backToTopButton.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

    window.addEventListener("scroll", updateBackToTopButton, { passive: true });
    window.addEventListener("resize", maybeLoadMoreOnScroll);
    window.addEventListener("resize", updateBackToTopButton);

    try {
        const response = await fetch("/api/feed");
        const payload = await response.json();
        const reviews = Array.isArray(payload) ? payload : payload.data || [];
        allFeedReviews = reviews.map(normalizeFeedReview);
        visibleFeedCount = FEED_PAGE_SIZE;
        updateFilterButtons();
        renderFeed();
        updateBackToTopButton();
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
    const reviewCharCount = document.getElementById("review-char-count");
    const message = document.getElementById("add-form-message");
    const reviewToast = document.getElementById("add-review-toast");
    const ratingButtons = Array.from(document.querySelectorAll(".rating_star"));
    const REVIEW_TEXT_LIMIT = 300;

    let selectedItem = null;
    let toastTimer = null;

    function showReviewToast(text, isError = false) {
        if (!reviewToast) return;

        if (toastTimer) {
            window.clearTimeout(toastTimer);
        }

        reviewToast.hidden = false;
        reviewToast.textContent = text;
        reviewToast.classList.toggle("is_error", isError);

        window.requestAnimationFrame(() => {
            reviewToast.classList.add("is_visible");
        });

        toastTimer = window.setTimeout(() => {
            reviewToast.classList.remove("is_visible");
            window.setTimeout(() => {
                reviewToast.hidden = true;
            }, 180);
        }, 2200);
    }

    function updateReviewCharCount() {
        if (!reviewText) return;

        if (reviewText.value.length > REVIEW_TEXT_LIMIT) {
            reviewText.value = reviewText.value.slice(0, REVIEW_TEXT_LIMIT);
        }

        if (reviewCharCount) {
            reviewCharCount.textContent = `${reviewText.value.length}/${REVIEW_TEXT_LIMIT}`;
        }
    }

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

    reviewText.addEventListener("input", updateReviewCharCount);

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
                updateReviewCharCount();
                ratingStatus.textContent = "No rating selected yet";
                ratingButtons.forEach((button) => button.classList.remove("is_active"));
                resultsContainer.innerHTML = "";
                count.textContent = "Start typing to search";
                showReviewToast("Review created successfully");
            } else {
                message.textContent = data?.errors?.[0]?.message || "Could not submit review.";
                showReviewToast("Review creation failed", true);
            }

        } catch (err) {
            console.error(err);
            message.textContent = "Server error. See console.";
            showReviewToast("Review creation failed", true);
        }
    });

    updateSelectedLabel();
    updateReviewCharCount();
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
