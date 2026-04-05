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
            <span>&#9733; ${entry.R_Rating || entry.review_rating || ""}</span>
        </article>
    `;
}

function formatFeedRatingDisplay(value) {
    const numericRating = Number(value);
    if (!Number.isFinite(numericRating)) {
        return { stars: "", score: "" };
    }

    const starCount = Math.max(0, Math.min(5, Math.round(numericRating)));
    const filledStar = "&#9733;";
    const emptyStar = "&#9734;";

    return {
        stars: `${filledStar.repeat(starCount)}${emptyStar.repeat(5 - starCount)}`,
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
        ? String(entry.artist_names || "").trim()
        : "";

    return `
        <article
            class="detail_review_card${isAlbumReview ? " detail_review_card_album" : ""}"
            data-item-id="${entry.review_id}"
            data-review-index="${index}"
        >
            <div class="detail_review_layout">
                <div class="detail_review_copy">
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

function renderProfileSummary(user) {
    const nameElement = document.getElementById("profile-name");
    const handleElement = document.getElementById("profile-handle");
    const memberElement = document.getElementById("profile-member");
    const username = String(user?.U_Username || "").trim();

    if (nameElement) {
        nameElement.textContent = username || "Profile";
    }

    if (handleElement) {
        handleElement.textContent = username ? `@${username}` : "";
    }

    if (memberElement) {
        memberElement.textContent = formatMemberSince(
            user?.U_DateCreated || user?.date_created
        );
    }
}
