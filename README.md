metonymic
==================

Flask app that lists WordPress or Tumblr posts as a dictionary.

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
```

#### Configure the app

```bash
$ cp .env.sample .env
```

Set your blog info (and, for Tumblr, API key) in the .env file.

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

Note: gunicorn prevents Flask from displaying a full trace. For debugging, it's easier to run Flask without gunicorn:

```
$ foreman run python runserver.py
```