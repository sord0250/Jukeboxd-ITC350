const DIRECTUS_URL = "http://64.23.156.15:8055";

function getCurrentUserId() {
    return localStorage.getItem("user_id");
}

function getCurrentUsername() {
    return localStorage.getItem("username");
}

function isLoggedIn() {
    return Boolean(getCurrentUserId());
}

function requireLogin() {
    if (!isLoggedIn()) {
        window.location.href = "/login";
        return false;
    }

    return true;
}

function logoutUser() {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("user_email");
    window.location.href = "/login";
}
