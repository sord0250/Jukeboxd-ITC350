# Jukeboxd File Guide

This document explains what each file in the repository does.

## Root Files

- `README.md`  
  The main quick-start guide for setting up a Python virtual environment and running the Flask app locally.

- `README2.md`  
  This file. It serves as a file-by-file map of the repository.

- `.env.example`  
  Template for the local environment variables the project expects, including the Flask secret key and Spotify API credentials.

- `requirements.txt`  
  Lists the Python dependencies the Flask app needs: Flask, Requests, and bcrypt.

- `setup_venv.ps1`  
  PowerShell helper script that creates the local `.venv`, installs dependencies, and prints the commands needed to launch the app.

- `endpoints`  
  Plain-text note file listing the main Directus collection endpoints and views used by the project.

- `creating_extension`  
  Plain-text troubleshooting notes for setting up a Directus extension and fixing Node/npm issues on the server.

## Database Milestones

### `jukeboxd/Milestone 3`

- `jukeboxd/Milestone 3/CreateTables`  
  The main SQL schema file. It creates the project database tables such as `USER`, `FRIENDSHIP`, `ALBUM`, `ARTIST`, `SONG`, `REVIEW`, `MAKES_SONG`, `MAKES_ALBUM`, and `COMMENT`.

- `jukeboxd/Milestone 3/Insert`  
  Seed-data SQL script that inserts example users, artists, albums, songs, relationship rows, and a few example reviews.

- `jukeboxd/Milestone 3/DeleteAll`  
  Reset script that deletes all major table data and resets auto-increment counters where appropriate.

- `jukeboxd/Milestone 3/DeleteSome`  
  Targeted cleanup script that removes a few specific sample users, songs, artists, albums, and related rows.

- `jukeboxd/Milestone 3/AddUserDateCreated`  
  Migration-style SQL script that adds `U_DateCreated` to the `USER` table and backfills it for existing rows.

### `jukeboxd/Milestone 4`

- `jukeboxd/Milestone 4/Review View`  
  SQL view that combines song, album, and artist reviews into a single feed-style result set.

- `jukeboxd/Milestone 4/Search Review View`  
  SQL view that joins songs, artists, and albums into a searchable catalog result.

- `jukeboxd/Milestone 4/Users Reviews View`  
  SQL view that joins `USER` and `REVIEW` so reviews can be queried by user.

- `jukeboxd/Milestone 4/Song Review View`  
  SQL view focused on song reviews and their related album information.

- `jukeboxd/Milestone 4/Album Review View`  
  SQL view focused on album reviews.

- `jukeboxd/Milestone 4/Artist Review View`  
  SQL view focused on artist reviews.

## Flask App

### `jukeboxd/FrontEnd`

- `jukeboxd/FrontEnd/app.py`  
  Flask entry point. It creates the app, sets template and static folders, loads the secret key, and registers every route module.

- `jukeboxd/FrontEnd/HowToLaunch.txt`  
  Short launch note with the commands needed to create a venv, install dependencies, activate the environment, and open the app.

### `jukeboxd/FrontEnd/backend`

- `jukeboxd/FrontEnd/backend/__init__.py`  
  Package marker for the backend module.

- `jukeboxd/FrontEnd/backend/config.py`  
  Central configuration file. It loads `.env`, reads the Flask secret key from environment variables, defines the Directus base URL, and stores input-size limits for sanitization.

### `jukeboxd/FrontEnd/backend/routes`

- `jukeboxd/FrontEnd/backend/routes/__init__.py`  
  Package marker for the backend route modules.

- `jukeboxd/FrontEnd/backend/routes/pages.py`  
  Server-rendered page routes for `/`, `/search`, `/profile`, `/profile/<username>`, `/add`, `/login`, `/register`, and `/stats`.

- `jukeboxd/FrontEnd/backend/routes/auth.py`  
  Authentication routes for login, registration, and logout. It also hashes passwords and stores the login session.

- `jukeboxd/FrontEnd/backend/routes/data.py`  
  Simple passthrough API routes that expose raw Directus collections such as artists, albums, users, reviews, and songs.

- `jukeboxd/FrontEnd/backend/routes/profile.py`  
  Profile API route for reading profile data and updating allowed profile fields like first and last name.

- `jukeboxd/FrontEnd/backend/routes/reviews.py`  
  Largest route module. It powers the review feed, related review search, likes, comments, user review lists, and review creation.

- `jukeboxd/FrontEnd/backend/routes/friendships.py`  
  Friendship API routes for loading friendship state, sending requests, accepting requests, canceling or declining requests, and removing friends.

### `jukeboxd/FrontEnd/backend/helpers`

- `jukeboxd/FrontEnd/backend/helpers/__init__.py`  
  Package marker for backend helper modules.

- `jukeboxd/FrontEnd/backend/helpers/common.py`  
  Shared backend utilities for extracting Directus payloads, filtering user reviews, normalizing item types, coercing like counts, and surfacing API error messages.

- `jukeboxd/FrontEnd/backend/helpers/comments.py`  
  Comment helper layer that loads comment rows from Directus, normalizes them, builds preview lists, and posts new comments.

- `jukeboxd/FrontEnd/backend/helpers/friendships.py`  
  Friendship-specific helper layer for reading friendship rows, normalizing friend data, ordering friendship pairs, and looking up users in friendships.

- `jukeboxd/FrontEnd/backend/helpers/input_sanitization.py`  
  Server-side sanitization and validation for names, usernames, emails, passwords, comments, reviews, ratings, and review payload construction.

- `jukeboxd/FrontEnd/backend/helpers/payloads.py`  
  Convenience wrapper functions for fetching the Directus payload bundles needed by feed, search, and profile review normalization.

- `jukeboxd/FrontEnd/backend/helpers/profile.py`  
  Profile helper functions for looking users up by username, serializing user objects, and translating Directus profile-update errors into friendlier messages.

- `jukeboxd/FrontEnd/backend/helpers/review_normalization.py`  
  Data-shaping layer that merges raw Directus review data with song, album, artist, and relationship tables so the frontend gets consistent feed/search/profile review objects.

## Templates

### `jukeboxd/FrontEnd/templates`

- `jukeboxd/FrontEnd/templates/index.html`  
  Home feed page. It renders the welcome section, feed filter buttons, feed list, and back-to-top button.

- `jukeboxd/FrontEnd/templates/search.html`  
  Search page. It renders the live search UI and the modal that shows top related reviews for a selected item.

- `jukeboxd/FrontEnd/templates/add.html`  
  Add-review page. It contains the search picker, star rating controls, review text area, form message, and review toast.

- `jukeboxd/FrontEnd/templates/login.html`  
  Login form page for email and password sign-in.

- `jukeboxd/FrontEnd/templates/register.html`  
  Registration form page for first name, last name, username, email, and password.

- `jukeboxd/FrontEnd/templates/profile.html`  
  Profile page layout. It shows profile summary info, friends, incoming requests, account actions, and the user’s review list.

- `jukeboxd/FrontEnd/templates/stats.html`  
  Placeholder page for future stats or messages work. Right now it only renders a very minimal page shell.

### `jukeboxd/FrontEnd/templates/components`

- `jukeboxd/FrontEnd/templates/components/navbar.html`  
  Shared top navigation bar used across the site, including the home logo, search/add links, and profile/account area.

- `jukeboxd/FrontEnd/templates/components/scripts.html`  
  Shared script include file that loads the app’s core JavaScript modules in order.

- `jukeboxd/FrontEnd/templates/components/profile_edit_modal.html`  
  Partial template for the edit-profile modal, including locked username/email fields and editable first/last name fields.

- `jukeboxd/FrontEnd/templates/components/profile_friends_modal.html`  
  Partial template for the popout friends-list modal on the profile page.

## Frontend Styles

### `jukeboxd/FrontEnd/static/css`

- `jukeboxd/FrontEnd/static/css/base.css`  
  Main stylesheet for the app. It contains the global layout, navbar, feed cards, search UI, add-review form, profile layout, modals, and responsive styling.

- `jukeboxd/FrontEnd/static/css/profile-friendships.css`  
  Focused stylesheet for friendship and friends-list UI on the profile page.

- `jukeboxd/FrontEnd/static/css/components.css`  
  Currently empty placeholder stylesheet. It appears to have been reserved for shared component styles but is not active right now.

- `jukeboxd/FrontEnd/static/css/layout.css`  
  Currently empty placeholder stylesheet. It appears to have been reserved for layout-specific styles but is not active right now.

## Frontend Images

### `jukeboxd/FrontEnd/static/img`

- `jukeboxd/FrontEnd/static/img/jb_background.png`  
  Main page background image used by the site’s global styling.

- `jukeboxd/FrontEnd/static/img/jb_logo.png`  
  Main Jukeboxd logo used in the navbar.

- `jukeboxd/FrontEnd/static/img/jb_favicon.png`  
  Browser favicon version of the logo with the white border cleaned up.

- `jukeboxd/FrontEnd/static/img/jb_logo_like.svg`  
  Like icon used in review card interactions.

- `jukeboxd/FrontEnd/static/img/jb_logo_comment.svg`  
  Comment icon used in review card interactions.

- `jukeboxd/FrontEnd/static/img/jb_logo_share.png`  
  Share icon asset for review or profile actions.

- `jukeboxd/FrontEnd/static/img/jb_search.png`  
  Navbar icon for the search page.

- `jukeboxd/FrontEnd/static/img/jb_add.png`  
  Navbar icon for the add-review page.

- `jukeboxd/FrontEnd/static/img/jb_profile.png`  
  Navbar icon for the profile page.

- `jukeboxd/FrontEnd/static/img/jb_profile_pic.png`  
  Placeholder profile picture used on profile and friendship UI.

- `jukeboxd/FrontEnd/static/img/jb_login.svg`  
  Icon shown in the navbar/account area for login.

- `jukeboxd/FrontEnd/static/img/jb_register.svg`  
  Icon shown in the navbar/account area for registration.

- `jukeboxd/FrontEnd/static/img/jb_logout.svg`  
  Icon shown in the navbar/account area for logout.

- `jukeboxd/FrontEnd/static/img/jb_record.png`  
  Fallback artwork image, especially for artist-style cards.

- `jukeboxd/FrontEnd/static/img/jb_albumcover.png`  
  Default/fallback album cover artwork.

- `jukeboxd/FrontEnd/static/img/jb_albumcover2.png`  
  Alternate album cover-style asset.

- `jukeboxd/FrontEnd/static/img/jb_chat.png`  
  Chat-style icon asset related to comment or messaging visuals.

- `jukeboxd/FrontEnd/static/img/jb_back_to_top.svg`  
  Icon used by the feed page’s back-to-top button.

## Frontend JavaScript

### `jukeboxd/FrontEnd/static/js/app`

- `jukeboxd/FrontEnd/static/js/app/boot.js`  
  App bootstrapper. It calls all page initialization functions after `DOMContentLoaded`.

- `jukeboxd/FrontEnd/static/js/app/core.js`  
  Small shared utility layer for checking login state, reading/writing localStorage identity, and logging out.

- `jukeboxd/FrontEnd/static/js/app/api.js`  
  Shared frontend API wrapper for search, feed, reviews, comments, profiles, friendships, and likes.

- `jukeboxd/FrontEnd/static/js/app/navbar.js`  
  Navbar behavior module. It fills the account dropdown with login/register or logout actions depending on local login state.

- `jukeboxd/FrontEnd/static/js/app/reviews.js`  
  Shared review UI engine. It normalizes review objects, builds feed cards, supports likes, opens the comment modal, formats ratings, and generates profile links from usernames.

### `jukeboxd/FrontEnd/static/js/app/pages`

- `jukeboxd/FrontEnd/static/js/app/pages/auth.js`  
  Login and registration page logic, including form validation, API calls, and localStorage session setup after login.

- `jukeboxd/FrontEnd/static/js/app/pages/feed.js`  
  Home feed page controller. It loads the feed, handles infinite scrolling, supports the all/friends/song/album/artist filters, and renders empty-state messages.

- `jukeboxd/FrontEnd/static/js/app/pages/search.js`  
  Search page controller. It performs live search queries, opens the detail modal, and loads the top related reviews for the selected item.

- `jukeboxd/FrontEnd/static/js/app/pages/add.js`  
  Add-review page controller. It handles search selection, star ratings, character counts, and posting new reviews.

- `jukeboxd/FrontEnd/static/js/app/pages/profile.js`  
  Main profile page controller. It loads profile data and review history, wires in like/comment behavior, and manages the edit-profile modal.

- `jukeboxd/FrontEnd/static/js/app/pages/profile_friendships.js`  
  Friendship-specific profile controller. It renders friends, requests, connection states, the friends modal, and the friend-action buttons.

## Archived or Scratch Frontend Files

### `jukeboxd/FrontEnd/static/js/uncessary files`

- `jukeboxd/FrontEnd/static/js/uncessary files/main.js`  
  Older monolithic frontend script kept for reference after the project was split into smaller modules.

- `jukeboxd/FrontEnd/static/js/uncessary files/mainog.js`  
  Earlier prototype version of the main frontend logic.

- `jukeboxd/FrontEnd/static/js/uncessary files/main.bk`  
  Backup copy of older frontend logic, including direct Directus calls from the browser.

- `jukeboxd/FrontEnd/static/js/uncessary files/mock-data.json`  
  Mock frontend data for an older fake-data-driven version of the UI.

- `jukeboxd/FrontEnd/static/js/uncessary files/data.json`  
  Empty or unused JSON placeholder file.

### `jukeboxd/FrontEnd/mess_around`

- `jukeboxd/FrontEnd/mess_around/layouts.html`  
  Standalone HTML playground file demonstrating normal flow, inline-block, flexbox, grid, and absolute positioning.

## Notes

- The runtime app is mainly driven by the files under `jukeboxd/FrontEnd/app.py`, `jukeboxd/FrontEnd/backend/`, `jukeboxd/FrontEnd/templates/`, and `jukeboxd/FrontEnd/static/js/app/`.
- The Milestone folders hold schema and SQL-view history for the project.
- Several files under `uncessary files`, `mess_around`, and the empty CSS files are archival or scratchpad material rather than active production code.
