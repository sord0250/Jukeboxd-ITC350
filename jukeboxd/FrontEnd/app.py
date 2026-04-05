from flask import Flask

from backend.config import BASE_DIR, SECRET_KEY
from backend.routes.auth import register_auth_routes
from backend.routes.data import register_data_routes
from backend.routes.friendships import register_friendship_routes
from backend.routes.pages import register_page_routes
from backend.routes.profile import register_profile_routes
from backend.routes.reviews import register_review_routes


app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates"),
    static_folder=str(BASE_DIR / "static"),
)
app.secret_key = SECRET_KEY


register_page_routes(app)
register_data_routes(app)
register_profile_routes(app)
register_friendship_routes(app)
register_auth_routes(app)
register_review_routes(app)


if __name__ == "__main__":
    app.run(debug=True)
