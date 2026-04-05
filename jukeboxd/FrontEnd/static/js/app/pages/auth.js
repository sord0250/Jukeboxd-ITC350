async function registerUser(firstName, lastName, username, email, password) {
    const response = await fetch("/api/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            firstName,
            lastName,
            username,
            email,
            password
        })
    });

    const data = await response.json().catch(() => ({}));

    return {
        success: response.ok && Boolean(data.success ?? true),
        message: data.message || (response.ok ? "Account created!" : "Could not create account.")
    };
}

function initRegisterPage() {
    const form = document.getElementById("register-form");
    const message = document.getElementById("register-message");

    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const firstName = document.getElementById("register-fname").value.trim();
        const lastName = document.getElementById("register-lname").value.trim();
        const username = document.getElementById("register-username").value.trim();
        const email = document.getElementById("register-email").value.trim();
        const password = document.getElementById("register-password").value;

        if (!firstName || !lastName || !username || !email || !password) {
            message.textContent = "Please fill out every field.";
            return;
        }

        if (username.length < 5 || username.length > 12) {
            message.textContent = "Username must be 5-12 characters.";
            return;
        }

        const result = await registerUser(firstName, lastName, username, email, password);

        if (result.success) {
            message.textContent = "Account created! Logging in...";

            const loginSuccess = await loginUser(email, password);

            if (loginSuccess) {
                window.location.href = "/";
            }
        } else {
            message.textContent = result.message;
        }
    });
}

async function loginUser(email, password) {
    const response = await fetch("/api/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });

    const data = await response.json();

    if (data.success) {
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("username", data.username);
        localStorage.setItem("user_email", data.email);
        return true;
    }

    return false;
}

function initLoginPage() {
    const form = document.getElementById("login-form");
    const message = document.getElementById("login-message");

    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        if (!email || !password) {
            message.textContent = "Please enter your email and password.";
            return;
        }

        const success = await loginUser(email, password);

        if (success) {
            message.textContent = "Login successful!";
            window.location.href = "/";
        } else {
            message.textContent = "Invalid email or password.";
        }
    });
}
