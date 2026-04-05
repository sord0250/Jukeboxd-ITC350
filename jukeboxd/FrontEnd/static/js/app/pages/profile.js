async function initProfilePage() {
    const profileReviewList = document.getElementById("profile-review-list");
    const reviewCount = document.getElementById("profile-reviews");
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
    const friendshipController = typeof createProfileFriendshipController === "function"
        ? createProfileFriendshipController({ isOwnProfile, getViewedUsername })
        : null;

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
        if (!friendshipController) {
            throw new Error("Could not initialize friendship controls right now.");
        }

        await friendshipController.refreshFriendshipData();
    } catch (err) {
        console.error("Friendship load error:", err);
        friendshipController?.renderFriendshipLoadError(err.message || "Could not load friendship data right now.");
    }
}
