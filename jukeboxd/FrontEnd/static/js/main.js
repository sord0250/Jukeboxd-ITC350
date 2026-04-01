const mockSearchItems = [
    {
        id: "diary-album",
        type: "album",
        title: "The Diary of Living",
        artist: "Adam Melchor",
        subtitle: "Album",
        year: "2024",
        art: "/static/img/jb_albumcover.png",
        genre: "Indie Folk",
        description: "A reflective, warm album with soft acoustic textures and quietly emotional songwriting.",
        reviews: [
            {
                username: "spencer_ord",
                avatar: "/static/img/jb_profile_pic.png",
                rating: "★★★★★",
                headline: "Quiet and beautiful all the way through",
                body: "I keep coming back to this album when I want something thoughtful and calm. It feels intimate without ever getting boring."
            },
            {
                username: "milo_turner",
                avatar: "/static/img/jb_profile_pic.png",
                rating: "★★★★☆",
                headline: "Soft, personal, and really well sequenced",
                body: "The writing is strong and the atmosphere is super consistent. A couple tracks took time to grow on me, but the whole thing lands."
            }
        ]
    },
    {
        id: "light-year-song",
        type: "song",
        title: "Light Year",
        artist: "Adam Melchor",
        subtitle: "Song",
        year: "2023",
        art: "/static/img/jb_albumcover.png",
        genre: "Indie Pop",
        description: "A tender song built around gentle melodies and a patient, emotional vocal performance.",
        reviews: [
            {
                username: "anniecase",
                avatar: "/static/img/jb_profile_pic.png",
                rating: "★★★★★",
                headline: "One of those songs that sneaks up on you",
                body: "The arrangement stays simple, but the emotion builds the longer it goes. I loved it more with every listen."
            },
            {
                username: "jordyvinyl",
                avatar: "/static/img/jb_profile_pic.png",
                rating: "★★★★☆",
                headline: "Really lovely songwriting",
                body: "It feels understated in a good way. Not flashy, just sincere and easy to return to."
            }
        ]
    },
    {
        id: "adam-artist",
        type: "artist",
        title: "Adam Melchor",
        artist: "Singer-songwriter",
        subtitle: "Artist",
        year: "",
        art: "/static/img/jb_profile_pic.png",
        genre: "Indie / Singer-Songwriter",
        description: "Known for warm acoustic production, conversational lyrics, and a thoughtful, understated style.",
        reviews: [
            {
                username: "ellie_sound",
                avatar: "/static/img/jb_profile_pic.png",
                rating: "★★★★★",
                headline: "One of my favorite writers right now",
                body: "There is something so human about his music. Even when the songs are small, they feel deeply lived in."
            }
        ]
    },
    {
        id: "ctrl-album",
        type: "album",
        title: "Ctrl",
        artist: "SZA",
        subtitle: "Album",
        year: "2017",
        art: "/static/img/jb_albumcover2.png",
        genre: "R&B",
        description: "A confident, emotionally messy, instantly recognizable modern R&B record.",
        reviews: [
            {
                username: "sophia_l",
                avatar: "/static/img/jb_profile_pic.png",
                rating: "★★★★★",
                headline: "Still sounds fresh",
                body: "This album has personality in every track. The writing feels messy in the best possible way."
            },
            {
                username: "nightdrive",
                avatar: "/static/img/jb_profile_pic.png",
                rating: "★★★★★",
                headline: "A near-perfect late-night album",
                body: "Huge hooks, but still intimate. It feels effortless even when it is doing a lot."
            }
        ]
    },
    {
        id: "snooze-song",
        type: "song",
        title: "Snooze",
        artist: "SZA",
        subtitle: "Song",
        year: "2022",
        art: "/static/img/jb_albumcover2.png",
        genre: "R&B",
        description: "A sleek, melodic song with an easy groove and a huge replay factor.",
        reviews: [
            {
                username: "caseyj",
                avatar: "/static/img/jb_profile_pic.png",
                rating: "★★★★★",
                headline: "Instant favorite",
                body: "The chorus is ridiculous. It feels smooth and catchy without being overproduced."
            }
        ]
    },
    {
        id: "sza-artist",
        type: "artist",
        title: "SZA",
        artist: "R&B artist",
        subtitle: "Artist",
        year: "",
        art: "/static/img/jb_profile_pic.png",
        genre: "R&B / Neo-Soul",
        description: "An artist with an instantly recognizable voice and a style that blends vulnerability, confidence, and sharp songwriting.",
        reviews: [
            {
                username: "mariestereo",
                avatar: "/static/img/jb_profile_pic.png",
                rating: "★★★★★",
                headline: "She has her own lane",
                body: "Even when she fits into pop or R&B, it still sounds completely like her."
            }
        ]
    },
    {
        id: "thriller-album",
        type: "album",
        title: "Thriller",
        artist: "Michael Jackson",
        subtitle: "Album",
        year: "1982",
        art: "/static/img/jb_albumcover2.png",
        genre: "Pop",
        description: "A landmark pop album packed with iconic performances, huge choruses, and polished production.",
        reviews: [
            {
                username: "vinylvince",
                avatar: "/static/img/jb_profile_pic.png",
                rating: "★★★★★",
                headline: "Basically a greatest hits album in disguise",
                body: "Every song feels massive. Even decades later, it still sounds expensive and alive."
            }
        ]
    },
    {
        id: "billie-jean-song",
        type: "song",
        title: "Billie Jean",
        artist: "Michael Jackson",
        subtitle: "Song",
        year: "1982",
        art: "/static/img/jb_albumcover2.png",
        genre: "Pop",
        description: "An instantly recognizable groove with one of the most famous basslines in popular music.",
        reviews: [
            {
                username: "retrocrate",
                avatar: "/static/img/jb_profile_pic.png",
                rating: "★★★★★",
                headline: "Perfect pacing",
                body: "That beat enters and the whole song locks in. It never wastes a second."
            }
        ]
    },
    {
        id: "punisher-album",
        type: "album",
        title: "Punisher",
        artist: "Phoebe Bridgers",
        subtitle: "Album",
        year: "2020",
        art: "/static/img/jb_albumcover.png",
        genre: "Indie Rock",
        description: "A detailed, atmospheric album that balances deadpan writing with huge emotional payoff.",
        reviews: [
            {
                username: "greyroom",
                avatar: "/static/img/jb_profile_pic.png",
                rating: "★★★★★",
                headline: "Sharp, funny, devastating",
                body: "The writing is so specific, and the production gives every lyric room to land."
            }
        ]
    },
    {
        id: "phoebe-artist",
        type: "artist",
        title: "Phoebe Bridgers",
        artist: "Indie artist",
        subtitle: "Artist",
        year: "",
        art: "/static/img/jb_profile_pic.png",
        genre: "Indie Rock / Folk",
        description: "An artist known for deadpan delivery, vivid lyrics, and emotionally precise songwriting.",
        reviews: [
            {
                username: "cassetteclub",
                avatar: "/static/img/jb_profile_pic.png",
                rating: "★★★★☆",
                headline: "Distinctive voice and point of view",
                body: "Even when the arrangements stay minimal, the writing keeps everything compelling."
            }
        ]
    }
];

function createSearchCard(item) {
    const meta = item.year ? `${item.subtitle} • ${item.year}` : item.subtitle;

    return `
        <button class="search_card" type="button" data-item-id="${item.id}" data-type="${item.type}">
            <div class="search_card_media">
                <img class="search_card_art" src="${item.art}" alt="${item.title}">
            </div>
            <div class="search_card_copy">
                <p class="search_card_type">${meta}</p>
                <h2 class="search_card_title">${item.title}</h2>
                <p class="search_card_artist">${item.artist}</p>
            </div>
        </button>
    `;
}

function createReviewPreview(review, itemId, reviewIndex) {
    return `
        <button class="detail_review_card" type="button" data-item-id="${itemId}" data-review-index="${reviewIndex}">
            <div class="detail_review_head">
                <div class="detail_review_identity">
                    <img class="detail_review_avatar" src="${review.avatar}" alt="${review.username}">
                    <span class="detail_review_username">${review.username}</span>
                </div>
                <span class="detail_review_rating">${review.rating}</span>
            </div>
            <h3 class="detail_review_title">${review.headline}</h3>
            <p class="detail_review_snippet">${review.body}</p>
        </button>
    `;
}

function getFeedReviews() {
    return mockSearchItems.flatMap((item) =>
        item.reviews.map((review, index) => ({
            id: `${item.id}-review-${index}`,
            itemId: item.id,
            itemTitle: item.title,
            itemArtist: item.artist,
            itemType: item.subtitle,
            art: item.art,
            username: review.username,
            avatar: review.avatar,
            rating: review.rating,
            body: review.body
        }))
    );
}

function createFeedCard(entry) {
    const artistLine = entry.itemType === "Artist" ? entry.itemType : entry.itemArtist;

    return `
        <article class="review_card" data-id="${entry.id}">
            <div class="review_body">
                <div class="review_panel">
                    <header class="card_header">
                        <div class="card_identity">
                            <img class="profile_pic" src="${entry.avatar}" alt="${entry.username}">
                            <span class="username">${entry.username}</span>
                        </div>
                    </header>

                    <div class="review">
                        <div class="album_info">
                            <h2 class="album_title">${entry.itemTitle}</h2>
                            <h3 class="artist">${artistLine}</h3>
                        </div>
                        <div class="star_rating">${entry.rating}</div>
                    </div>

                    <p class="review_text">${entry.body}</p>

                    <footer class="card_footer">
                        <div class="social-buttons">
                            <button class="s-button" type="button" aria-label="Like review">
                                <img class="s-button-logo" src="/static/img/jb_logo_like.svg" alt="">
                            </button>
                        </div>
                    </footer>
                </div>

                <div class="review-cover-link">
                    <div class="vinyl_image">
                        <img class="albumrecord" src="/static/img/jb_record.png" alt="record">
                        <div class="albumcover">
                            <img src="${entry.art}" alt="${entry.itemTitle}">
                        </div>
                    </div>
                </div>
            </div>
        </article>
    `;
}

function createDetailContent(item) {
    const meta = [item.subtitle, item.year, item.genre].filter(Boolean).join(" • ");
    const reviewsMarkup = item.reviews.length
        ? item.reviews.map((review, index) => createReviewPreview(review, item.id, index)).join("")
        : `<p class="detail_empty_reviews">No reviews yet.</p>`;

    return `
        <div class="detail_modal_layout">
            <div class="detail_media_column">
                <img class="detail_cover" src="${item.art}" alt="${item.title}">
            </div>
            <div class="detail_copy_column">
                <p class="detail_meta">${meta}</p>
                <h2 id="detail-title" class="detail_title">${item.title}</h2>
                <p class="detail_artist">${item.artist}</p>
                <p class="detail_description">${item.description}</p>
                <section class="detail_reviews_section">
                    <div class="detail_reviews_heading_row">
                        <h3 class="detail_reviews_heading">Community Reviews</h3>
                        <span class="detail_reviews_count">${item.reviews.length} review${item.reviews.length === 1 ? "" : "s"}</span>
                    </div>
                    <div class="detail_reviews_list">
                        ${reviewsMarkup}
                    </div>
                </section>
            </div>
        </div>
    `;
}

function createReviewModalContent(item, review) {
    const meta = [item.title, item.artist].filter(Boolean).join(" • ");

    return `
        <div class="review_modal_body">
            <p class="review_modal_meta">${meta}</p>
            <div class="review_modal_head">
                <div class="detail_review_identity">
                    <img class="detail_review_avatar" src="${review.avatar}" alt="${review.username}">
                    <span class="detail_review_username">${review.username}</span>
                </div>
                <span class="detail_review_rating">${review.rating}</span>
            </div>
            <h2 id="review-modal-title" class="review_modal_title">${review.headline}</h2>
            <p class="review_modal_copy">${review.body}</p>
        </div>
    `;
}

function filterSearchItems(items, query) {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
        return items;
    }

    return items.filter((item) => {
        const haystack = `${item.title} ${item.artist} ${item.type}`.toLowerCase();
        return haystack.includes(normalizedQuery);
    });
}

function initSearchPage() {
    const input = document.getElementById("search-input");
    const resultsContainer = document.getElementById("search-results");
    const count = document.getElementById("search-count");
    const detailModal = document.getElementById("detail-modal");
    const detailContent = document.getElementById("detail-content");
    const detailClose = document.getElementById("detail-close");
    const reviewModal = document.getElementById("review-modal");
    const reviewContent = document.getElementById("review-content");
    const reviewClose = document.getElementById("review-close");

    if (!input || !resultsContainer || !count || !detailModal || !detailContent || !detailClose || !reviewModal || !reviewContent || !reviewClose) {
        return;
    }

    function openModal(modal) {
        modal.hidden = false;
        document.body.classList.add("modal_open");
    }

    function closeModal(modal) {
        modal.hidden = true;
        if (detailModal.hidden && reviewModal.hidden) {
            document.body.classList.remove("modal_open");
        }
    }

    function openDetailModal(itemId) {
        const item = mockSearchItems.find((entry) => entry.id === itemId);

        if (!item) {
            return;
        }

        detailContent.innerHTML = createDetailContent(item);
        openModal(detailModal);
    }

    function openReviewModal(itemId, reviewIndex) {
        const item = mockSearchItems.find((entry) => entry.id === itemId);
        const review = item?.reviews?.[reviewIndex];

        if (!item || !review) {
            return;
        }

        reviewContent.innerHTML = createReviewModalContent(item, review);
        openModal(reviewModal);
    }

    function renderResults(query = "") {
        const results = filterSearchItems(mockSearchItems, query);

        count.textContent = `${results.length} result${results.length === 1 ? "" : "s"}`;

        if (!results.length) {
            resultsContainer.innerHTML = `
                <div class="search_empty">
                    <h2 class="search_empty_title">No matches yet</h2>
                    <p class="search_empty_copy">Try searching by album title, song name, or artist.</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = results.map(createSearchCard).join("");
    }

    input.addEventListener("input", (event) => {
        renderResults(event.target.value);
    });

    resultsContainer.addEventListener("click", (event) => {
        const card = event.target.closest("[data-item-id]");

        if (!card) {
            return;
        }

        openDetailModal(card.dataset.itemId);
    });

    detailContent.addEventListener("click", (event) => {
        const reviewCard = event.target.closest(".detail_review_card");

        if (!reviewCard) {
            return;
        }

        openReviewModal(reviewCard.dataset.itemId, Number(reviewCard.dataset.reviewIndex));
    });

    detailClose.addEventListener("click", () => closeModal(detailModal));
    reviewClose.addEventListener("click", () => closeModal(reviewModal));

    detailModal.addEventListener("click", (event) => {
        if (event.target === detailModal) {
            closeModal(detailModal);
        }
    });

    reviewModal.addEventListener("click", (event) => {
        if (event.target === reviewModal) {
            closeModal(reviewModal);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
            return;
        }

        if (!reviewModal.hidden) {
            closeModal(reviewModal);
            return;
        }

        if (!detailModal.hidden) {
            closeModal(detailModal);
        }
    });

    renderResults();
}

function initHomeFeed() {
    const feedList = document.getElementById("feed-list");

    if (!feedList) {
        return;
    }

    const feedEntries = getFeedReviews();
    feedList.innerHTML = feedEntries.map(createFeedCard).join("");
}

document.addEventListener("DOMContentLoaded", () => {
    initHomeFeed();
    initSearchPage();
});
