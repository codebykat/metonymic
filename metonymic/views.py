from metonymic import app
from metonymic.database import db_session
from metonymic.models import Post, Blog

from flask import render_template, request

from os import environ

from sqlalchemy import func

import json
from urllib import urlencode
from urllib2 import urlopen

@app.route( '/' )
def index():
	load_new_posts()
	get_blog_info()

	posts = Post.query.order_by( func.upper( Post.title ) )

	bloginfo = Blog.query.get( 1 )

	return render_template( 'index.html', posts=posts, bloginfo=bloginfo )

# helper functions
def load_new_posts():
	blogname = environ['BLOGNAME']
	api_key = environ['API_KEY']
	tumblr_url = 'http://api.tumblr.com/v2/blog/' + blogname + '.tumblr.com/posts/'

	# load posts until we run out, or find one we already loaded
	posts = []
	offset = 0

	found_posts = False

	while not found_posts:

		args = urlencode( { 'api_key': api_key, 'offset': offset } )

		fp = urlopen( tumblr_url + '?' + args )
		results = json.load( fp )

		# check return value.  TODO handle this better.
		if 200 != results['meta']['status']:
			print "error fetching posts; no new posts loaded"
			break

		if len( results['response']['posts'] ) == 0:
			break

		offset = offset + 20

		for post in results['response']['posts']:

			if 'title' in post:
				if Post.query.filter( Post.title == post['title'] ).count() > 0:
					found_posts = True
					break

				p = Post( post['title'], post['post_url'] )

				db_session.add( p )

			else:  # no title
				print post


	db_session.commit()

	return True

def get_blog_info():
	blogname = environ['BLOGNAME']
	api_key = environ['API_KEY']
	tumblr_url = 'http://api.tumblr.com/v2/blog/' + blogname + '.tumblr.com/info'
	args = urlencode( { 'api_key': api_key } )

	fp = urlopen( tumblr_url + '?' + args )
	results = json.load( fp )

	if 200 != results['meta']['status']:
		print "error fetching bloginfo"
		return False

	b = Blog.query.get(1)
	if b is None:
		b = Blog()
		db_session.add( b )

	bloginfo = results['response']['blog']
	b.title = bloginfo['title']
	b.total_posts = bloginfo['posts']
	b.last_updated = bloginfo['updated']
	b.description = bloginfo['description']
	b.url = bloginfo['url']

	db_session.commit()

	return True