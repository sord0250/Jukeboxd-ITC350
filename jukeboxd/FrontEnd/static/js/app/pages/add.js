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

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

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
