function createProfileFriendshipController({
    isOwnProfile = false,
    getViewedUsername = () => ""
} = {}) {
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

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && friendsModal && !friendsModal.hidden) {
            closeFriendsModal();
        }
    });

    return {
        refreshFriendshipData,
        renderFriendshipLoadError
    };
}
