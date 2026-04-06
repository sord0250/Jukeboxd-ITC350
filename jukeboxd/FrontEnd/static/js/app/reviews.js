let allFeedReviews = [];
let activeFeedFilter = "all";
let visibleFeedCount = 6;
const FEED_PAGE_SIZE = 6;
const REVIEW_COMMENT_TEXT_LIMIT = 280;
let reviewCommentsModalElements = null;
let activeReviewCommentsModalRequestId = 0;
let activeReviewCommentsModalState = null;

function createReviewCommentsModalState(overrides = {}) {
    return {
        reviewId: null,
        title: "Review",
        comments: [],
        total: 0,
        isLoading: false,
        errorMessage: "",
        getReviews: null,
        setReviews: null,
        rerenderReviews: null,
        ...overrides
    };
}

function isReviewCommentsModalOpenFor(reviewId) {
    if (!reviewCommentsModalElements || reviewCommentsModalElements.overlay.hidden || !activeReviewCommentsModalState) {
        return false;
    }

    return String(activeReviewCommentsModalState.reviewId) === String(reviewId);
}

function syncReviewCommentState(reviewId, commentsPreview, commentCount, getReviews, setReviews, rerenderReviews) {
    updateFeedReviewComments(reviewId, commentsPreview, commentCount);

    if (typeof getReviews !== "function" || typeof setReviews !== "function") {
        return;
    }

    setReviews(updateReviewCommentsInList(getReviews(), reviewId, commentsPreview, commentCount));

    if (typeof rerenderReviews === "function") {
        rerenderReviews();
    }
}

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

function updateFeedReviewComments(reviewId, commentsPreview, commentCount) {
    allFeedReviews = allFeedReviews.map((entry) => {
        if (String(entry.review_id) !== String(reviewId)) {
            return entry;
        }

        return normalizeFeedReview({
            ...entry,
            comments_preview: commentsPreview,
            comment_count: commentCount
        });
    });
}

function updateReviewCommentsInList(reviews, reviewId, commentsPreview, commentCount) {
    return reviews.map((entry) => {
        if (String(entry.review_id) !== String(reviewId)) {
            return entry;
        }

        return normalizeFeedReview({
            ...entry,
            comments_preview: commentsPreview,
            comment_count: commentCount
        });
    });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function normalizeReviewComment(comment) {
    return {
        comment_id: comment?.comment_id ?? comment?.C_ID ?? comment?.id ?? null,
        review_id: comment?.review_id ?? comment?.R_ID ?? null,
        username: String(comment?.username ?? comment?.U_Username ?? "user").trim() || "user",
        comment_text: String(comment?.comment_text ?? comment?.C_Text ?? "").trim(),
        time_created: String(comment?.time_created ?? comment?.C_TimeCreated ?? comment?.date_created ?? "")
    };
}

function getReviewCommentsPreview(entry) {
    if (!Array.isArray(entry?.comments_preview)) {
        return [];
    }

    return entry.comments_preview
        .map(normalizeReviewComment)
        .filter((comment) => comment.comment_text);
}

function getReviewCommentCount(entry) {
    const rawCount = Number(entry?.comment_count ?? getReviewCommentsPreview(entry).length);
    return Number.isFinite(rawCount) ? Math.max(0, rawCount) : 0;
}

function formatReviewCommentTimestamp(value) {
    if (!value) {
        return "";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(parsed);
}

function createReviewCommentMarkup(comment, showTimestamp = false) {
    const normalizedComment = normalizeReviewComment(comment);
    const timestamp = formatReviewCommentTimestamp(normalizedComment.time_created);

    return `
        <article class="detail_comment_item">
            <div class="detail_comment_head">
                <span class="detail_comment_author">${escapeHtml(normalizedComment.username)}</span>
                ${showTimestamp && timestamp ? `<span class="detail_comment_time">${escapeHtml(timestamp)}</span>` : ""}
            </div>
            <p class="detail_comment_text">${escapeHtml(normalizedComment.comment_text)}</p>
        </article>
    `;
}

function ensureReviewCommentsModal() {
    if (reviewCommentsModalElements) {
        return reviewCommentsModalElements;
    }

    const overlay = document.createElement("div");
    overlay.id = "review-comments-modal";
    overlay.className = "modal_overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
        <div class="modal_shell modal_shell_review" role="dialog" aria-modal="true" aria-labelledby="review-comments-title">
            <button class="modal_close" type="button" aria-label="Close comments" data-close-review-comments-modal>&times;</button>
            <div id="review-comments-content"></div>
        </div>
    `;

    document.body.appendChild(overlay);

    const content = overlay.querySelector("#review-comments-content");
    const closeButton = overlay.querySelector("[data-close-review-comments-modal]");

    closeButton?.addEventListener("click", closeReviewCommentsModal);
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            closeReviewCommentsModal();
        }
    });
    overlay.addEventListener("submit", async (event) => {
        const commentForm = event.target.closest("[data-review-comments-modal-form]");
        if (!commentForm || !activeReviewCommentsModalState?.reviewId) {
            return;
        }

        event.preventDefault();

        if (!requireLogin()) {
            return;
        }

        if (commentForm.dataset.isPending === "true") {
            return;
        }

        const reviewId = activeReviewCommentsModalState.reviewId;
        const commentInput = commentForm.querySelector("[name='comment']");
        const messageElement = commentForm.querySelector(".detail_comment_message");
        const submitButton = commentForm.querySelector(".detail_comment_submit");
        const commentText = String(commentInput?.value || "").trim();

        if (!commentText) {
            if (messageElement) {
                messageElement.textContent = "Write a comment first.";
            }
            return;
        }

        if (commentText.length > REVIEW_COMMENT_TEXT_LIMIT) {
            if (messageElement) {
                messageElement.textContent = `Comments must be ${REVIEW_COMMENT_TEXT_LIMIT} characters or fewer.`;
            }
            return;
        }

        commentForm.dataset.isPending = "true";
        if (submitButton) {
            submitButton.disabled = true;
        }
        if (messageElement) {
            messageElement.textContent = "Posting...";
        }

        try {
            const result = await createReviewComment(reviewId, commentText);
            const commentsPreview = Array.isArray(result?.comments_preview)
                ? result.comments_preview.map(normalizeReviewComment)
                : [];
            const commentCount = Number(result?.comment_count ?? commentsPreview.length);
            const newComment = normalizeReviewComment(result?.data || {
                review_id: reviewId,
                username: getCurrentUsername(),
                comment_text: commentText,
                time_created: new Date().toISOString()
            });

            syncReviewCommentState(
                reviewId,
                commentsPreview,
                commentCount,
                activeReviewCommentsModalState.getReviews,
                activeReviewCommentsModalState.setReviews,
                activeReviewCommentsModalState.rerenderReviews
            );

            activeReviewCommentsModalState = createReviewCommentsModalState({
                ...activeReviewCommentsModalState,
                comments: [
                    newComment,
                    ...activeReviewCommentsModalState.comments.filter((comment) => (
                        String(comment.comment_id) !== String(newComment.comment_id)
                    ))
                ],
                total: commentCount,
                isLoading: false,
                errorMessage: ""
            });
            renderReviewCommentsModal(activeReviewCommentsModalState);

            const nextCommentInput = reviewCommentsModalElements?.content.querySelector("[name='comment']");
            nextCommentInput?.focus();
        } catch (err) {
            if (messageElement) {
                messageElement.textContent = err.message || "Could not add comment.";
            }
        } finally {
            delete commentForm.dataset.isPending;
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && reviewCommentsModalElements && !reviewCommentsModalElements.overlay.hidden) {
            closeReviewCommentsModal();
        }
    });

    reviewCommentsModalElements = { overlay, content };
    return reviewCommentsModalElements;
}

function closeReviewCommentsModal() {
    if (!reviewCommentsModalElements) {
        return;
    }

    const previousState = activeReviewCommentsModalState;

    reviewCommentsModalElements.overlay.hidden = true;
    document.body.classList.remove("modal_open");
    activeReviewCommentsModalRequestId += 1;
    activeReviewCommentsModalState = null;

    if (typeof previousState?.rerenderReviews === "function") {
        previousState.rerenderReviews();
    }
}

function renderReviewCommentsModal({ reviewId, title, comments = [], total = 0, isLoading = false, errorMessage = "" }) {
    const modal = ensureReviewCommentsModal();
    const totalLabel = `${total} comment${total === 1 ? "" : "s"}`;
    const commentPlaceholder = isLoggedIn()
        ? "Add a comment..."
        : "Log in to comment...";
    const commentSubmitLabel = isLoggedIn() ? "Post comment" : "Log in";

    let bodyMarkup = '<p class="detail_comments_empty">No comments yet.</p>';

    if (isLoading) {
        bodyMarkup = '<p class="detail_comments_empty">Loading comments...</p>';
    } else if (errorMessage) {
        bodyMarkup = `<p class="detail_comments_empty">${escapeHtml(errorMessage)}</p>`;
    } else if (comments.length) {
        bodyMarkup = `
            <div class="review_comments_modal_list">
                ${comments.map((comment) => createReviewCommentMarkup(comment, true)).join("")}
            </div>
        `;
    }

    modal.content.innerHTML = `
        <div class="review_comments_modal_body">
            <p class="review_modal_meta">Comments</p>
            <h2 id="review-comments-title" class="review_modal_title">${escapeHtml(title || "Review")}</h2>
            <p class="review_comments_modal_count">${escapeHtml(totalLabel)}</p>
            <form class="detail_comment_form review_comments_modal_form" data-review-comments-modal-form="${escapeHtml(reviewId)}">
                <label class="sr_only" for="review-comments-modal-input">Add a comment</label>
                <textarea
                    id="review-comments-modal-input"
                    class="detail_comment_input"
                    name="comment"
                    rows="3"
                    maxlength="${REVIEW_COMMENT_TEXT_LIMIT}"
                    placeholder="${commentPlaceholder}"
                ></textarea>
                <div class="detail_comment_form_footer">
                    <span class="detail_comment_hint">${REVIEW_COMMENT_TEXT_LIMIT} characters max</span>
                    <button class="detail_comment_submit" type="submit">${commentSubmitLabel}</button>
                </div>
                <p class="detail_comment_message" aria-live="polite"></p>
            </form>
            ${bodyMarkup}
        </div>
    `;
}

async function openReviewCommentsModal(reviewId, reviewTitle, options = {}) {
    const modal = ensureReviewCommentsModal();
    const requestId = ++activeReviewCommentsModalRequestId;
    activeReviewCommentsModalState = createReviewCommentsModalState({
        reviewId: String(reviewId),
        title: reviewTitle || "Review",
        comments: Array.isArray(options.initialComments)
            ? options.initialComments.map(normalizeReviewComment)
            : [],
        total: Number(options.initialTotal ?? 0),
        isLoading: true,
        errorMessage: "",
        getReviews: options.getReviews || null,
        setReviews: options.setReviews || null,
        rerenderReviews: options.rerenderReviews || null
    });

    document.body.classList.add("modal_open");
    modal.overlay.hidden = false;
    renderReviewCommentsModal(activeReviewCommentsModalState);

    try {
        const payload = await fetchReviewComments(reviewId);
        if (requestId !== activeReviewCommentsModalRequestId) {
            return;
        }

        activeReviewCommentsModalState = createReviewCommentsModalState({
            ...activeReviewCommentsModalState,
            comments: Array.isArray(payload?.data) ? payload.data.map(normalizeReviewComment) : [],
            total: Number(payload?.total ?? 0),
            isLoading: false,
            errorMessage: ""
        });
        renderReviewCommentsModal(activeReviewCommentsModalState);
    } catch (err) {
        if (requestId !== activeReviewCommentsModalRequestId) {
            return;
        }

        activeReviewCommentsModalState = createReviewCommentsModalState({
            ...activeReviewCommentsModalState,
            isLoading: false,
            errorMessage: err.message || "Could not load comments right now."
        });
        renderReviewCommentsModal(activeReviewCommentsModalState);
    }
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
        num_likes: getReviewLikeCount(entry),
        comment_count: getReviewCommentCount(entry),
        comments_preview: getReviewCommentsPreview(entry)
    };
}

function createProfileHref(username) {
    const normalizedUsername = String(username || "").trim();
    const currentUsername = String(getCurrentUsername() || "").trim();

    if (!normalizedUsername) {
        return "";
    }

    if (normalizedUsername === currentUsername) {
        return "/profile";
    }

    return `/profile/${encodeURIComponent(normalizedUsername)}`;
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

function bindReviewCommentHandler(container, getReviews, setReviews, rerenderReviews) {
    if (!container) {
        return;
    }

    container.addEventListener("click", (event) => {
        const openCommentButton = event.target.closest("[data-open-review-comment]");
        if (openCommentButton) {
            event.preventDefault();

            const reviewId = openCommentButton.dataset.openReviewComment;
            const reviewTitle = openCommentButton.dataset.reviewTitle || "Review";
            const reviewEntry = typeof getReviews === "function"
                ? getReviews().find((entry) => String(entry.review_id) === String(reviewId))
                : null;

            openReviewCommentsModal(reviewId, reviewTitle, {
                initialComments: reviewEntry ? getReviewCommentsPreview(reviewEntry) : [],
                initialTotal: reviewEntry ? getReviewCommentCount(reviewEntry) : Number(openCommentButton.dataset.commentCount || 0),
                getReviews,
                setReviews,
                rerenderReviews
            });
            return;
        }
    });
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

function formatAverageRatingDisplay(value) {
    const numericRating = Number(value);
    if (!Number.isFinite(numericRating)) {
        return { stars: "", score: "" };
    }

    const clampedRating = Math.max(0, Math.min(5, numericRating));
    const starCount = Math.round(clampedRating);
    const filledStar = "&#9733;";
    const emptyStar = "&#9734;";

    return {
        stars: `${filledStar.repeat(starCount)}${emptyStar.repeat(5 - starCount)}`,
        score: `${clampedRating.toFixed(1)}/5`
    };
}

function createFeedCard(entry, index = 0) {
    const likedState = hasLikedReview(entry.review_id);
    const likeCount = getReviewLikeCount(entry);
    const commentCount = getReviewCommentCount(entry);
    const artwork = getReviewArtwork(entry);
    const reviewType = String(entry.review_type || "").toLowerCase();
    const showsVinyl = reviewType === "album" || reviewType === "song";
    const ratingDisplay = formatFeedRatingDisplay(entry.review_rating);
    const supportingLine = (reviewType === "song" || reviewType === "album")
        ? String(entry.artist_names || "").trim()
        : "";
    const reviewTitle = String(entry.title || "Review");
    const reviewUsername = String(entry.username || "").trim();
    const profileHref = createProfileHref(reviewUsername);
    const isCommentsModalOpen = isReviewCommentsModalOpenFor(entry.review_id);
    const commentButtonAriaLabel = commentCount > 0
        ? `Open comments. ${commentCount} comment${commentCount === 1 ? "" : "s"} on this review.`
        : "Open comments and add a comment.";

    return `
        <article
            class="detail_review_card"
            data-item-id="${entry.review_id}"
            data-review-index="${index}"
        >
            <div class="detail_review_layout">
                <div class="detail_review_copy">
                    <div class="detail_review_head">
                        <div class="detail_review_identity">
                            <img class="detail_review_avatar" src="/static/img/jb_profile_pic.png" alt="user">
                            ${profileHref
                                ? `<a class="detail_review_username" href="${escapeHtml(profileHref)}">${escapeHtml(reviewUsername)}</a>`
                                : `<span class="detail_review_username">${escapeHtml(reviewUsername || "user")}</span>`}
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

                            <button
                                class="detail_review_comment_button${isCommentsModalOpen ? " is-active" : ""}"
                                type="button"
                                data-open-review-comment="${entry.review_id}"
                                data-review-title="${escapeHtml(reviewTitle)}"
                                data-comment-count="${commentCount}"
                                aria-haspopup="dialog"
                                aria-label="${escapeHtml(commentButtonAriaLabel)}"
                            >
                                <span class="detail_review_comment_icon" aria-hidden="true">&#128172;</span>
                                <span class="detail_review_comment_count">${commentCount}</span>
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

                <div class="detail_review_media${showsVinyl ? " detail_review_media_with_vinyl" : ""}">
                    ${showsVinyl ? `<img class="detail_review_vinyl" src="/static/img/jb_record.png" alt="">` : ""}
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
