from sqlalchemy import Table, Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship, backref
from words.database import Base, db_session


class Post( Base ):
	__tablename__ = 'posts'
	id = Column( Integer, primary_key=True )
	title = Column( Text, unique=True )
	post_url = Column( Text )
	# timestamp = Column( DateTime )

	def __init__( self, title=None, post_url=None ):
		self.title = title
		self.post_url = post_url

	def __repr__(self):
		return self.title