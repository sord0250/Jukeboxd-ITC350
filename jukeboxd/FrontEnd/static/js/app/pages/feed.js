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
        const payload = await fetchFeedReviews();
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
