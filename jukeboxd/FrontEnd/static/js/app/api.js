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
    const response = await fetch("/api/feed");
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

async function fetchCurrentProfile() {
    const response = await fetch("/api/profile");
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load your profile.");
    }

    return data.data || {};
}

async function updateCurrentProfile(profileData) {
    const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(profileData)
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not update your profile.");
    }

    return data.data || {};
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
