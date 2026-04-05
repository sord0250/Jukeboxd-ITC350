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

async function fetchReviewComments(reviewId) {
    const response = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/comments`);
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load comments.");
    }

    return data;
}

async function createReviewComment(reviewId, commentText) {
    const response = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/comments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            commentText
        })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not add comment.");
    }

    return data;
}

async function fetchFeedReviews() {
    const response = await fetch("/api/feed");
    return await response.json();
}

async function createReview(reviewData) {
    const response = await fetch("/api/add_review", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(reviewData)
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not submit review.");
    }

    return data;
}

async function fetchUserReviews(requestedUsername = "") {
    const normalizedUsername = String(requestedUsername || "").trim();
    const profileUsername = document.body.dataset.username;
    const storedUsername = getCurrentUsername();
    const username = normalizedUsername || profileUsername || storedUsername;
    const url = username
        ? `/api/user_reviews?username=${encodeURIComponent(username)}`
        : "/api/user_reviews";
    const response = await fetch(url);
    return await response.json();
}

async function fetchProfile(requestedUsername = "") {
    const normalizedUsername = String(requestedUsername || "").trim();
    const url = normalizedUsername
        ? `/api/profile?username=${encodeURIComponent(normalizedUsername)}`
        : "/api/profile";
    const response = await fetch(url);
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
        throw new Error(data.message || (normalizedUsername ? "Could not load that profile." : "Could not load your profile."));
    }

    return data.data || {};
}

async function fetchCurrentProfile() {
    return await fetchProfile();
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

async function fetchFriendshipData(requestedUsername = "") {
    const normalizedUsername = String(requestedUsername || "").trim();
    const url = normalizedUsername
        ? `/api/friendships?username=${encodeURIComponent(normalizedUsername)}`
        : "/api/friendships";
    const response = await fetch(url);
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load friendship data.");
    }

    return data.data || {};
}

async function createFriendRequest(username) {
    const response = await fetch("/api/friendships", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not send that friend request.");
    }

    return data;
}

async function updateFriendship(friendshipId, action) {
    const response = await fetch(`/api/friendships/${encodeURIComponent(friendshipId)}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ action })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not update that friendship.");
    }

    return data;
}

async function deleteFriendship(friendshipId) {
    const response = await fetch(`/api/friendships/${encodeURIComponent(friendshipId)}`, {
        method: "DELETE"
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not update that friendship.");
    }

    return data;
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
