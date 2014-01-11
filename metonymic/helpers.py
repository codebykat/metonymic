from metonymic import app
from metonymic.database import db_session
from metonymic.models import Post, Blog

from os import environ

import json
from urllib import urlencode
from urllib2 import urlopen

from time import time
from datetime import timedelta

def load_blog_info():
	# only update info every five minutes
	b = Blog.query.get( 1 )
	if ( b is not None ) and ( time() - b.info_last_updated <= timedelta( minutes=5 ).total_seconds() ):
		return True

	blogname = environ['BLOGNAME']
	api_key = environ['API_KEY']

	if not blogname or not api_key:
		print 'BLOGNAME and API_KEY must be defined in your .env file!'
		return False

	tumblr_url = 'http://api.tumblr.com/v2/blog/' + blogname + '.tumblr.com/info'
	args = urlencode( { 'api_key': api_key } )

	fp = urlopen( tumblr_url + '?' + args )
	results = json.load( fp )

	if 200 != results['meta']['status']:
		print 'Error fetching bloginfo!'
		return False

	if b is None:
		b = Blog()
		db_session.add( b )

	bloginfo = results['response']['blog']
	b.title = bloginfo['title']
	b.total_posts = bloginfo['posts']
	b.last_updated = bloginfo['updated']
	b.description = bloginfo['description']
	b.url = bloginfo['url']

	b.info_last_updated = int( time() )

	db_session.commit()

	return True

def load_posts():
	b = Blog.query.get( 1 )
	# if we don't have blog info, return an error
	if b is None:
		print 'Run load_blog_info() first!'
		return False

	# if there's nothing new to load, skip it
	if b.last_updated <= b.posts_last_updated:
		return True

	blogname = environ['BLOGNAME']
	api_key = environ['API_KEY']

	if not blogname or not api_key:
		print 'BLOGNAME and API_KEY must be defined in your .env file!'
		return False

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


	b.posts_last_updated = int( time() )

	db_session.commit()

	return True