from sqlalchemy import Table, Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship, backref
from words.database import Base, db_session


class Post( Base ):
	__tablename__ = 'posts'
	id = Column( Integer, primary_key=True )
	title = Column( String( 255 ), unique=True )
	body = Column( Text )
	post_url = Column( String( 255 ) )
	timestamp = Column( DateTime )
	source_url = Column( String( 255 ) )

	#def __init__( self, text=None ):
	#	self.text = text

	def __repr__(self):
		return self.title
