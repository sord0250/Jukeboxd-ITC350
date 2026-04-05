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
    let activeAverageRating = null;
    let activeAverageRatingCount = 0;
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
        const averageRatingDisplay = formatAverageRatingDisplay(activeAverageRating);
        const reviewCountLabel = relatedReviewsLoading
            ? "Loading reviews..."
            : relatedReviewsError
                ? "Could not load reviews"
                : activeRelatedReviewCount > activeRelatedReviews.length
                    ? `Showing ${activeRelatedReviews.length} of ${activeRelatedReviewCount} reviews`
                    : `${activeRelatedReviewCount} review${activeRelatedReviewCount === 1 ? "" : "s"}`;
        const averageRatingMarkup = relatedReviewsLoading
            ? `
                <div class="detail_average_rating">
                    <span class="detail_average_label">Community average</span>
                    <span class="detail_average_empty">Loading rating...</span>
                </div>
            `
            : relatedReviewsError
                ? `
                    <div class="detail_average_rating">
                        <span class="detail_average_label">Community average</span>
                        <span class="detail_average_empty">Could not load rating</span>
                    </div>
                `
            : Number.isFinite(Number(activeAverageRating)) && activeAverageRatingCount > 0
                ? `
                    <div class="detail_average_rating">
                        <span class="detail_average_label">Community average</span>
                        <span class="detail_average_stars">${averageRatingDisplay.stars}</span>
                        <span class="detail_average_score">${averageRatingDisplay.score}</span>
                        <span class="detail_average_count">${activeAverageRatingCount} rating${activeAverageRatingCount === 1 ? "" : "s"}</span>
                    </div>
                `
                : `
                    <div class="detail_average_rating">
                        <span class="detail_average_label">Community average</span>
                        <span class="detail_average_empty">No ratings yet</span>
                    </div>
                `;

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
                    ${averageRatingMarkup}
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

    bindReviewCommentHandler(
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
        activeAverageRating = null;
        activeAverageRatingCount = 0;
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
            activeAverageRating = Number.isFinite(Number(payload?.average_rating))
                ? Number(payload.average_rating)
                : null;
            activeAverageRatingCount = Number(payload?.rated_total ?? activeRelatedReviewCount);
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
