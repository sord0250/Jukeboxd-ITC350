from flask import redirect, render_template, session


def register_page_routes(app):
    @app.route("/")
    def home():
        return render_template("index.html")

    @app.route("/search")
    def search():
        if "user_id" not in session:
            return redirect("/login")
        return render_template("search.html")

    @app.route("/profile")
    def profile():
        if "user_id" not in session:
            return redirect("/login")

        return render_template(
            "profile.html",
            user_id=session["user_id"],
            username=session["username"]
        )

    @app.route("/add")
    def add():
        if "user_id" not in session:
            return redirect("/login")
        return render_template("add.html")

    @app.route("/login")
    def login():
        return render_template("login.html")

    @app.route("/register")
    def register():
        return render_template("register.html")

    @app.route("/stats")
    def stats():
        return render_template("stats.html")
