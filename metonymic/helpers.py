from metonymic import app
from metonymic.database import db_session
from metonymic.models import Post, Blog

from os import environ
import sys

import json
from urllib import urlencode
from urllib2 import urlopen

from sqlalchemy.exc import IntegrityError

from datetime import datetime, timedelta

def load_blog_info():
	# only update info every five minutes
	b = Blog.query.get( 1 )
	if ( b is not None ) and ( datetime.utcnow() - b.info_last_updated <= timedelta( minutes=5 ) ):
		return True

	wordpress = environ.get( 'WORDPRESS', False )
	tumblr = environ.get( 'TUMBLR', False )
	api_key = environ.get( 'TUMBLR_API_KEY', False )

	# input validation
	error = False
	if not ( wordpress or tumblr ):
		print 'Please define a blog to connect to (TUMBLR or WORDPRESS)!'
		error = True

	if tumblr and not api_key:
		print 'TUMBLR_API_KEY must be defined in your .env file!'
		error = True

	if wordpress and tumblr:
		print 'Please define one of WORDPRESS or TUMBLR, not both!'
		error = True

	if error:
		return False

	# get blog info
	if wordpress:
		results = connect_wordpress( wordpress )
	else:
		results = connect_tumblr( tumblr, api_key )

	if b is None:
		b = Blog()
		db_session.add( b )

	if wordpress:
		b.title = results['name']
		b.description = results['description']
		b.url = results['URL']		
	else:
		bloginfo = results['response']['blog']
		b.title = bloginfo['title']
		b.total_posts = bloginfo['posts']
		b.last_updated = bloginfo['updated']
		b.description = bloginfo['description']
		b.url = bloginfo['url']

	b.info_last_updated = datetime.utcnow()

	db_session.commit()

	return True

def connect_wordpress( blogname ):
	wp_url = 'http://public-api.wordpress.com/rest/v1/sites/' + blogname

	fp = urlopen( wp_url )
	results = json.load( fp )

	return results

def connect_tumblr( blogname, api_key ):
	tumblr_url = 'http://api.tumblr.com/v2/blog/' + blogname + '/info'
	args = urlencode( { 'api_key': api_key } )

	fp = urlopen( tumblr_url + '?' + args )
	results = json.load( fp )

	if not results or 200 != results['meta']['status']:
		print 'Error fetching bloginfo!'
		return False

	return results

def load_posts():
	b = Blog.query.get( 1 )
	# if we don't have blog info, return an error
	if b is None:
		print 'Run load_blog_info() first!'
		return False

	wordpress = environ.get( 'WORDPRESS', False )
	tumblr = environ.get( 'TUMBLR', False )

	if wordpress:
		load_wordpress_posts()
	else:
		load_tumblr_posts()

def load_wordpress_posts():
	b = Blog.query.get( 1 )
	blogname = environ['WORDPRESS']
	wp_url = 'http://public-api.wordpress.com/rest/v1/sites/' + blogname + '/posts'

	posts = []
	count = 0
	posts_to_request = 100
	found_posts = False

	args = { 'offset': 0, 'fields': 'title,URL', 'number': posts_to_request }

	# subtract 7 because the blog is in PST and we're saving timestamps in UTC
	if b.posts_last_updated:
		args['after'] = ( b.posts_last_updated - timedelta( hours=7 ) ).isoformat()

	while True:
		sys.stderr.write( '.' )
		fp = urlopen( wp_url + '?' + urlencode( args ) )
		results = json.load( fp )

		for post in results['posts']:
			if Post.query.filter( Post.title == post['title'] ).count() > 0:
				found_posts = True
				break

			p = Post( post['title'], post['URL'] )

			db_session.add( p )
			count = count + 1

		if len( results['posts'] ) < posts_to_request or found_posts :
			break
		else:
			args['offset'] += posts_to_request

	b.posts_last_updated = datetime.utcnow()
	b.total_posts = Post.query.count()
	db_session.commit()

	print 'Done! ' + str( count ) + ' posts loaded.'
	return True

def load_tumblr_posts():
	b = Blog.query.get( 1 )

	# if there's nothing new to load, skip it
	if b.posts_last_updated and ( b.last_updated <= b.posts_last_updated.strftime( '%s' ) ):
		return True

	blogname = environ['TUMBLR']
	api_key = environ['TUMBLR_API_KEY']

	if not blogname or not api_key:
		print 'TUMBLR and TUMBLR_API_KEY must be defined in your .env file!'
		return False

	tumblr_url = 'http://api.tumblr.com/v2/blog/' + blogname + '/posts/'

	# load posts until we run out, or find one we already loaded
	posts = []
	posts_to_request = 20
	found_posts = False

	while not found_posts:
		fp = urlopen( tumblr_url + '?' + urlencode( args ) )
		results = json.load( fp )

		# check return value.  TODO handle this better.
		if 200 != results['meta']['status']:
			print "error fetching posts; no new posts loaded"
			break

		if len( results['response']['posts'] ) < posts_to_request:
			break

		args['offset'] += posts_to_request

		for post in results['response']['posts']:

			if 'title' in post:
				if Post.query.filter( Post.title == post['title'] ).count() > 0:
					found_posts = True
					break

				p = Post( post['title'], post['post_url'] )

				db_session.add( p )

			else:  # no title
				print post


	b.posts_last_updated = datetime.now()

	db_session.commit()

	return True