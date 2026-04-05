async function initProfilePage() {
    const profileReviewList = document.getElementById("profile-review-list");
    const reviewCount = document.getElementById("profile-reviews");
    const friendCount = document.getElementById("profile-friends");
    const friendsSummary = document.getElementById("profile-friends-summary");
    const friendsPreview = document.getElementById("profile-friends-preview");
    const openFriendsModalButton = document.getElementById("profile-open-friends-modal");
    const friendsModal = document.getElementById("profile-friends-modal");
    const closeFriendsModalButton = document.getElementById("profile-friends-close");
    const friendsModalTitle = document.getElementById("profile-friends-modal-title");
    const friendsModalMeta = document.getElementById("profile-friends-modal-meta");
    const friendsList = document.getElementById("profile-friends-list");
    const friendRequestsCount = document.getElementById("profile-friend-requests-count");
    const friendRequestsList = document.getElementById("profile-friend-requests-list");
    const friendshipStatus = document.getElementById("profile-friendship-status");
    const friendshipActions = document.getElementById("profile-friendship-actions");
    const friendshipMessage = document.getElementById("profile-friendship-message");
    const profileReviewsSubtitle = document.getElementById("profile-reviews-subtitle");
    const editProfileButton = document.getElementById("edit-profile-button");
    const editProfileModal = document.getElementById("edit-profile-modal");
    const editProfileForm = document.getElementById("edit-profile-form");
    const editProfileMessage = document.getElementById("edit-profile-message");
    const closeEditProfileButton = document.getElementById("edit-profile-close");
    const cancelEditProfileButton = document.getElementById("edit-profile-cancel");
    const saveEditProfileButton = document.getElementById("edit-profile-save");
    const firstNameInput = document.getElementById("edit-profile-first-name");
    const lastNameInput = document.getElementById("edit-profile-last-name");
    const usernameInput = document.getElementById("edit-profile-username");
    const emailInput = document.getElementById("edit-profile-email");
    const isOwnProfile = document.body.dataset.isOwnProfile === "true";
    const initialProfileUsername = String(document.body.dataset.username || "").trim();
    if (!profileReviewList) return;

    if (!requireLogin()) return;

    let profileReviews = [];
    let currentProfile = null;
    function getViewedUsername() {
        return String(document.body.dataset.username || initialProfileUsername || "").trim();
    }

    function formatPossessiveHandle(username) {
        const normalizedUsername = String(username || "").trim();

        if (!normalizedUsername) {
            return "this user's";
        }

        return normalizedUsername.endsWith("s")
            ? `@${normalizedUsername}'`
            : `@${normalizedUsername}'s`;
    }

    function updateProfileReviewsSubtitle(user = null) {
        if (!profileReviewsSubtitle) {
            return;
        }

        if (isOwnProfile) {
            profileReviewsSubtitle.textContent = "A full feed-style view of your most recent reviews.";
            return;
        }

        const username = String(user?.U_Username || getViewedUsername()).trim();
        profileReviewsSubtitle.textContent = `A full feed-style view of ${formatPossessiveHandle(username)} most recent reviews.`;
    }

    function setEditProfileMessage(text = "", isError = false) {
        if (!editProfileMessage) {
            return;
        }

        editProfileMessage.textContent = text;
        editProfileMessage.classList.toggle("is_error", isError);
    }

    function setFriendshipMessage(text = "", isError = false) {
        if (!friendshipMessage) {
            return;
        }

        friendshipMessage.textContent = text;
        friendshipMessage.classList.toggle("is_error", isError);
    }

    function openFriendsModal() {
        if (!friendsModal) {
            return;
        }

        friendsModal.hidden = false;
        document.body.classList.add("modal_open");
    }

    function closeFriendsModal() {
        if (!friendsModal) {
            return;
        }

        friendsModal.hidden = true;
        document.body.classList.remove("modal_open");

        if (openFriendsModalButton) {
            openFriendsModalButton.focus();
        }
    }

    function renderProfileReviews() {
        if (reviewCount) {
            reviewCount.textContent = profileReviews.length;
        }

        if (!profileReviews.length) {
            profileReviewList.innerHTML = `
                <article class="detail_review_card">
                    <h3 class="detail_review_title">No reviews yet</h3>
                    <p class="detail_review_snippet">${isOwnProfile ? "You have not posted any reviews yet." : "This user has not posted any reviews yet."}</p>
                </article>
            `;
            return;
        }

        profileReviewList.innerHTML = profileReviews.map(createFeedCard).join("");
    }

    function renderProfileLoadError(message) {
        const profileName = document.getElementById("profile-name");
        const profileHandle = document.getElementById("profile-handle");
        const profileMember = document.getElementById("profile-member");
        const viewedUsername = getViewedUsername();

        if (profileName) {
            profileName.textContent = viewedUsername || "Profile unavailable";
        }

        if (profileHandle) {
            profileHandle.textContent = viewedUsername ? `@${viewedUsername}` : "";
        }

        if (profileMember) {
            profileMember.textContent = "Unknown";
        }

        if (reviewCount) {
            reviewCount.textContent = "0";
        }

        updateProfileReviewsSubtitle({ U_Username: viewedUsername });
        profileReviewList.innerHTML = `
            <article class="detail_review_card">
                <h3 class="detail_review_title">Profile unavailable</h3>
                <p class="detail_review_snippet">${escapeHtml(message || "Could not load this profile right now.")}</p>
            </article>
        `;
    }

    function createProfileConnectionMarkup(user, metaText = "", actionsMarkup = "") {
        const username = String(user?.U_Username || "").trim();
        const profileHref = createProfileHref(username);

        return `
            <article class="profile_connection_item">
                <div class="profile_connection_main">
                    ${profileHref
                        ? `<a class="profile_connection_name" href="${escapeHtml(profileHref)}">@${escapeHtml(username)}</a>`
                        : `<span class="profile_connection_name">@${escapeHtml(username || "user")}</span>`}
                    ${metaText ? `<p class="profile_connection_meta">${escapeHtml(metaText)}</p>` : ""}
                </div>
                ${actionsMarkup ? `<div class="profile_connection_actions">${actionsMarkup}</div>` : ""}
            </article>
        `;
    }

    function createFriendButtonMarkup(user) {
        const username = String(user?.U_Username || "").trim();
        const profileHref = createProfileHref(username);

        return `
            <button class="profile_friend_button" type="button" data-profile-href="${escapeHtml(profileHref)}">
                <img class="profile_friend_avatar" src="/static/img/jb_profile_pic.png" alt="">
                <span class="profile_friend_username">@${escapeHtml(username || "user")}</span>
            </button>
        `;
    }

    function renderFriendsList(friends = []) {
        if (friendCount) {
            friendCount.textContent = String(friends.length);
        }

        if (friendsSummary) {
            friendsSummary.textContent = `${friends.length} total`;
        }

        if (friendsModalTitle) {
            friendsModalTitle.textContent = isOwnProfile ? "Your friends" : `${getViewedUsername()}'s friends`;
        }

        if (friendsModalMeta) {
            friendsModalMeta.textContent = friends.length
                ? `${friends.length} connection${friends.length === 1 ? "" : "s"}`
                : (isOwnProfile ? "You have not added any friends yet." : "This user has not added any friends yet.");
        }

        if (friendsPreview) {
            friendsPreview.textContent = friends.length
                ? `${friends.length} friend${friends.length === 1 ? "" : "s"} ready to browse in the popout list.`
                : (isOwnProfile ? "You have not added any friends yet." : "This user has not added any friends yet.");
        }

        if (!friendsList) {
            return;
        }

        if (!friends.length) {
            friendsList.innerHTML = `<p class="profile_connection_empty">${isOwnProfile ? "You have not added any friends yet." : "This user has not added any friends yet."}</p>`;
            return;
        }

        friendsList.innerHTML = friends
            .map(createFriendButtonMarkup)
            .join("");
    }

    function renderIncomingRequests(requests = []) {
        if (!friendRequestsList) {
            return;
        }

        if (friendRequestsCount) {
            friendRequestsCount.textContent = `${requests.length} pending`;
        }

        if (!requests.length) {
            friendRequestsList.innerHTML = '<p class="profile_connection_empty">No incoming friend requests right now.</p>';
            return;
        }

        friendRequestsList.innerHTML = requests
            .map((item) => createProfileConnectionMarkup(
                item.user,
                "Sent you a friend request.",
                `
                    <button class="profile_connection_button" type="button" data-friendship-action="accept" data-friendship-id="${item.friendship_id}">Accept</button>
                    <button class="profile_connection_button profile_connection_button_secondary profile_connection_button_danger" type="button" data-friendship-action="delete" data-friendship-id="${item.friendship_id}">Decline</button>
                `
            ))
            .join("");
    }

    function renderFriendshipActions(friendship = null) {
        if (!friendshipStatus || !friendshipActions) {
            return;
        }

        const viewedUsername = getViewedUsername();
        const normalizedStatus = String(friendship?.status || "none").trim().toLowerCase();
        const normalizedDirection = String(friendship?.direction || "").trim().toLowerCase();
        const friendshipId = friendship?.friendship_id;

        setFriendshipMessage("");
        friendshipActions.innerHTML = "";

        if (normalizedStatus === "accepted") {
            friendshipStatus.textContent = `You and @${viewedUsername} are friends.`;
            friendshipActions.innerHTML = `
                <button class="profile_connection_button profile_connection_button_secondary profile_connection_button_danger" type="button" data-friendship-action="delete" data-friendship-id="${friendshipId}">Remove friend</button>
            `;
            return;
        }

        if (normalizedStatus === "pending" && normalizedDirection === "outgoing") {
            friendshipStatus.textContent = `Your friend request to @${viewedUsername} is pending.`;
            friendshipActions.innerHTML = `
                <button class="profile_connection_button profile_connection_button_secondary" type="button" data-friendship-action="delete" data-friendship-id="${friendshipId}">Cancel request</button>
            `;
            return;
        }

        if (normalizedStatus === "pending" && normalizedDirection === "incoming") {
            friendshipStatus.textContent = `@${viewedUsername} sent you a friend request.`;
            friendshipActions.innerHTML = `
                <button class="profile_connection_button" type="button" data-friendship-action="accept" data-friendship-id="${friendshipId}">Accept request</button>
                <button class="profile_connection_button profile_connection_button_secondary profile_connection_button_danger" type="button" data-friendship-action="delete" data-friendship-id="${friendshipId}">Decline</button>
            `;
            return;
        }

        if (normalizedStatus === "blocked") {
            friendshipStatus.textContent = "This friendship is unavailable right now.";
            return;
        }

        friendshipStatus.textContent = `You are not friends with @${viewedUsername} yet.`;
        friendshipActions.innerHTML = `
            <button class="profile_connection_button" type="button" data-friendship-action="request">Add friend</button>
        `;
    }

    function renderFriendshipData(friendshipData = null) {
        renderFriendsList(friendshipData?.friends || []);

        if (isOwnProfile) {
            renderIncomingRequests(friendshipData?.incoming_requests || []);
            return;
        }

        renderFriendshipActions(friendshipData?.friendship || null);
    }

    function renderFriendshipLoadError(message = "") {
        if (friendCount) {
            friendCount.textContent = "0";
        }

        if (friendsSummary) {
            friendsSummary.textContent = "Unavailable";
        }

        if (friendsPreview) {
            friendsPreview.textContent = message || "Could not load friends right now.";
        }

        if (friendsModalMeta) {
            friendsModalMeta.textContent = "Unavailable";
        }

        if (friendsList) {
            friendsList.innerHTML = `<p class="profile_connection_empty">${escapeHtml(message || "Could not load friends right now.")}</p>`;
        }

        if (isOwnProfile) {
            if (friendRequestsCount) {
                friendRequestsCount.textContent = "Unavailable";
            }

            if (friendRequestsList) {
                friendRequestsList.innerHTML = `<p class="profile_connection_empty">${escapeHtml(message || "Could not load friend requests right now.")}</p>`;
            }

            return;
        }

        if (friendshipStatus) {
            friendshipStatus.textContent = "Could not load connection details right now.";
        }

        if (friendshipActions) {
            friendshipActions.innerHTML = "";
        }

        setFriendshipMessage(message || "Could not load connection details right now.", true);
    }

    function openEditProfileModal() {
        if (!editProfileModal || !editProfileForm || !currentProfile) {
            return;
        }

        firstNameInput.value = currentProfile.U_FName || "";
        lastNameInput.value = currentProfile.U_LName || "";
        usernameInput.value = currentProfile.U_Username || "";
        emailInput.value = currentProfile.U_Email || "";
        saveEditProfileButton.disabled = false;
        setEditProfileMessage("");
        editProfileModal.hidden = false;
        document.body.classList.add("modal_open");
        firstNameInput.focus();
    }

    function closeEditProfileModal() {
        if (!editProfileModal) {
            return;
        }

        editProfileModal.hidden = true;
        document.body.classList.remove("modal_open");
        saveEditProfileButton.disabled = false;
        setEditProfileMessage("");

        if (editProfileButton) {
            editProfileButton.focus();
        }
    }

    async function refreshProfileReviews() {
        const payload = await fetchUserReviews(getViewedUsername());
        const reviews = payload.data || payload;
        profileReviews = reviews.map(normalizeFeedReview);
        renderProfileReviews();
    }

    async function refreshFriendshipData() {
        const friendshipData = await fetchFriendshipData(getViewedUsername());
        renderFriendshipData(friendshipData);
        return friendshipData;
    }

    async function handleFriendshipAction(event) {
        const actionButton = event.target.closest("[data-friendship-action]");
        if (!actionButton) {
            return;
        }

        event.preventDefault();

        if (actionButton.dataset.isPending === "true") {
            return;
        }

        const action = String(actionButton.dataset.friendshipAction || "").trim().toLowerCase();
        const friendshipId = actionButton.dataset.friendshipId;
        const actionGroup = actionButton.closest(".profile_connection_actions");
        const relatedButtons = actionGroup
            ? Array.from(actionGroup.querySelectorAll("[data-friendship-action]"))
            : [actionButton];

        relatedButtons.forEach((button) => {
            button.dataset.isPending = "true";
            button.disabled = true;
        });

        if (!isOwnProfile) {
            setFriendshipMessage(action === "request" ? "Sending..." : "Updating...");
        }

        try {
            let result = null;

            if (action === "request") {
                result = await createFriendRequest(getViewedUsername());
            } else if (action === "accept") {
                result = await updateFriendship(friendshipId, "accept");
            } else if (action === "delete") {
                result = await deleteFriendship(friendshipId);
            } else {
                throw new Error("That friendship action is not supported.");
            }

            await refreshFriendshipData();
            if (!isOwnProfile) {
                setFriendshipMessage(result?.message || "Friendship updated.");
            }
        } catch (err) {
            console.error("Friendship action error:", err);
            if (!isOwnProfile) {
                setFriendshipMessage(err.message || "Could not update that friendship right now.", true);
            }
        } finally {
            relatedButtons.forEach((button) => {
                delete button.dataset.isPending;
                button.disabled = false;
            });
        }
    }

    function handleFriendButtonNavigation(event) {
        const friendButton = event.target.closest("[data-profile-href]");
        if (!friendButton) {
            return;
        }

        const profileHref = String(friendButton.dataset.profileHref || "").trim();
        if (!profileHref) {
            return;
        }

        window.location.href = profileHref;
    }

    bindReviewLikeHandler(
        profileReviewList,
        () => profileReviews,
        (reviews) => {
            profileReviews = reviews;
        },
        renderProfileReviews
    );

    bindReviewCommentHandler(
        profileReviewList,
        () => profileReviews,
        (reviews) => {
            profileReviews = reviews;
        },
        renderProfileReviews
    );

    if (friendshipActions) {
        friendshipActions.addEventListener("click", handleFriendshipAction);
    }

    if (friendRequestsList) {
        friendRequestsList.addEventListener("click", handleFriendshipAction);
    }

    if (openFriendsModalButton) {
        openFriendsModalButton.addEventListener("click", openFriendsModal);
    }

    if (closeFriendsModalButton) {
        closeFriendsModalButton.addEventListener("click", closeFriendsModal);
    }

    if (friendsModal) {
        friendsModal.addEventListener("click", (event) => {
            if (event.target === friendsModal) {
                closeFriendsModal();
            }
        });
    }

    if (friendsList) {
        friendsList.addEventListener("click", handleFriendButtonNavigation);
    }

    if (editProfileButton) {
        editProfileButton.addEventListener("click", openEditProfileModal);
    }

    if (closeEditProfileButton) {
        closeEditProfileButton.addEventListener("click", closeEditProfileModal);
    }

    if (cancelEditProfileButton) {
        cancelEditProfileButton.addEventListener("click", closeEditProfileModal);
    }

    if (editProfileModal) {
        editProfileModal.addEventListener("click", (event) => {
            if (event.target === editProfileModal) {
                closeEditProfileModal();
            }
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && friendsModal && !friendsModal.hidden) {
            closeFriendsModal();
        }

        if (event.key === "Escape" && editProfileModal && !editProfileModal.hidden) {
            closeEditProfileModal();
        }
    });

    if (editProfileForm) {
        editProfileForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const profileData = {
                firstName: firstNameInput.value.trim(),
                lastName: lastNameInput.value.trim(),
                username: usernameInput.value.trim()
            };

            if (!profileData.firstName || !profileData.lastName || !profileData.username) {
                setEditProfileMessage("First name, last name, and username are required.", true);
                return;
            }

            if (profileData.username.length < 5 || profileData.username.length > 12) {
                setEditProfileMessage("Username must be 5-12 characters.", true);
                return;
            }

            saveEditProfileButton.disabled = true;
            setEditProfileMessage("Saving...");

            try {
                const updatedProfile = await updateCurrentProfile(profileData);
                currentProfile = updatedProfile;
                renderProfileSummary(updatedProfile);
                updateProfileReviewsSubtitle(updatedProfile);

                document.body.dataset.username = updatedProfile.U_Username || getViewedUsername();
                if (isOwnProfile) {
                    localStorage.setItem("username", updatedProfile.U_Username || "");
                }

                closeEditProfileModal();
                try {
                    await refreshProfileReviews();
                } catch (refreshErr) {
                    console.error("Profile review refresh error:", refreshErr);
                }
            } catch (err) {
                console.error("Profile update error:", err);
                saveEditProfileButton.disabled = false;
                setEditProfileMessage(err.message || "Could not update your profile.", true);
            }
        });
    }

    updateProfileReviewsSubtitle();

    try {
        const [profile, reviewPayload] = await Promise.all([
            fetchProfile(getViewedUsername()),
            fetchUserReviews(getViewedUsername())
        ]);
        currentProfile = profile;
        document.body.dataset.username = profile.U_Username || getViewedUsername();
        if (isOwnProfile) {
            localStorage.setItem("username", profile.U_Username || "");
            localStorage.setItem("user_email", profile.U_Email || "");
        }
        renderProfileSummary(profile);
        updateProfileReviewsSubtitle(profile);
        const reviews = reviewPayload.data || reviewPayload;
        profileReviews = reviews.map(normalizeFeedReview);
        renderProfileReviews();
    } catch (err) {
        console.error("Profile load error:", err);
        renderProfileLoadError(err.message || "Could not load this profile right now.");
        return;
    }

    try {
        await refreshFriendshipData();
    } catch (err) {
        console.error("Friendship load error:", err);
        renderFriendshipLoadError(err.message || "Could not load friendship data right now.");
    }
}
