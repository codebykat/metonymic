from metonymic import app
from metonymic.database import db_session
from metonymic.models import Post, Blog
from metonymic import helpers

from flask import render_template, request

from sqlalchemy import func

@app.route( '/' )
def index():
	# call helper functions load_blog_info() and load_posts() to load info
	# maybe schedule this later, for now we can call it from here
	helpers.load_blog_info()
	helpers.load_posts()

	posts = Post.query.order_by( func.upper( Post.title ) ).all()

	bloginfo = Blog.query.get( 1 )

	return render_template( 'index.html', posts=posts, bloginfo=bloginfo )