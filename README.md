metonymic
==================

Flask app that lists Tumblr posts as a dictionary.

## Local Development

Requirements:

* Python
* [virtualenv](https://pypi.python.org/pypi/virtualenv)
* Postgres (or other local database)
* [foreman](https://github.com/ddollar/foreman.git) (or the Heroku Toolbelt)

#### Install local dependencies

```bash
$ virtulenv env
$ source env/bin/activate
$ pip install -r requirements.txt
$ cp .env.sample .env
```

#### Local Database 

Create a local database:

```
$ createdb metonymic-dev
```

Set the DATABASE_URL appropriately in your .env file:

```
DATABASE_URL=postgresql://localhost/metonymic-dev
```

Load the local database schema:

```
$ foreman run python
>>> from metonymic import database
>>> database.init_db()
```

Set your blog name and API key in the .env file.

Then, do the initial load of blog info and posts (this might take a few minutes if you have many posts):
```
$ foreman run python
>>> from metonymic import helpers
>>> helpers.load_blog_info()
>>> helpers.load_posts()
```

#### Running the server

Start foreman, and visit your development server at http://localhost:5000

```
$ foreman start
```
