document.addEventListener("click", (event) => {
    if (event.target.classList.contains("profile_action_button_logout")) {
        logoutUser();
    }
});

function initNavbarAccount() {
    const dropdown = document.getElementById("nav-account-dropdown");
    if (!dropdown) return;

    const userId = getCurrentUserId();

    if (userId) {
        dropdown.innerHTML = `
            <a class="nav-link nav-dropdown-link" href="/login" id="logout-button" aria-label="Logout" title="Logout" data-nav-hint="Logout">
                <img class="nav-icon" src="/static/img/jb_logout.svg" alt="logout">
            </a>
        `;

        const logoutButton = document.getElementById("logout-button");
        if (logoutButton) {
            logoutButton.addEventListener("click", (event) => {
                event.preventDefault();
                logoutUser();
            });
        }
    } else {
        dropdown.innerHTML = `
            <a class="nav-link nav-dropdown-link" href="/login" aria-label="Login" title="Login" data-nav-hint="Login">
                <img class="nav-icon" src="/static/img/jb_login.svg" alt="login">
            </a>
            <a class="nav-link nav-dropdown-link" href="/register" aria-label="Register" title="Register" data-nav-hint="Register">
                <img class="nav-icon" src="/static/img/jb_register.svg" alt="register">
            </a>
        `;
    }
}
