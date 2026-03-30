from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/search")
def search():
    return render_template("search.html")

@app.route("/profile")
def profile():
    return render_template("profile.html")

@app.route("/add")
def add():
    return render_template("add.html")

if __name__ == "__main__":
    app.run(debug=True)
