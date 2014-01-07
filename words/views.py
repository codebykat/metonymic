from words import app
from words.database import db_session
from words.models import Post

from flask import render_template, request

@app.route( '/' )
def index():
	posts = Post.query.all()

	return render_template( 'index.html', posts=posts )
