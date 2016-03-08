jQuery( function($) {

	// update navbar
	$( '#results-count' ).html( localStorage.inboxCount );

	// refresh records list on settings update
	$( "#save-settings" ).click( function() {
		// @todo track what actually changed instead of redoing everything
		if ( id ) {
			$( '#alert-header' ).empty();
			$( '#author-edit').val( '' );
			$( '#title-edit' ).val( '' );
			updateTitleAndAuthor();

			$( '#formatted-quote' ).hide();

			loadAirtableRecord( id );
		}
		// redo selected word search
		if ( $( '#selected-word' ).text() ) {
			wordnikLookup( $( '#selected-word' ).text() );

		}
	} );

	$( '#edit-book-meta' ).click( function( e ) {
		e.preventDefault();
		$( '#book-meta' ).hide();
		$( '#book-meta-edit' ).show();
	} );

	$( '#title-edit' ).change( updateTitleAndAuthor );
	$( '#author-edit' ).change( updateTitleAndAuthor );

	$( '#title-edit' ).blur( cancelMetaEdit );
	$( '#author-edit' ).blur( cancelMetaEdit );

	$( '#quote-input' ).change( function( e ) {
		// attempt to parse out pasted quote
		var quote = $( e.currentTarget ).val(),
		    lines = quote.split( '\n' ),
		    title = lines[0],
		    author = lines[1].substr( 3 ),
		    content = lines[4];
		$( e.currentTarget ).val( content );
		$( "#author-edit" ).val( author );
		$( "#title-edit" ).val( title );
		updateTitleAndAuthor();
		linkifyQuote();
	} );

	function loadAirtableRecord( id ) {
		var url = localStorage.getItem( "airtable-url" );
		    api_key = localStorage.getItem( "airtable-key" );

		if ( ! url || ! api_key ) {
			var settingsLink = "<a href='#settings' data-toggle='modal'>settings</a>",
			    message = "Can't load quote; check " + settingsLink + ".",
			    errorDiv = '<div class="alert alert-danger" role="alert">' + message + '</div>';
			$( '#alert-header' ).html( errorDiv );
			return;
		}

		$( '#alert-header' ).empty();
		url = $( '#airtable-prefix' ).text() + url;

		$.ajax( {
			url: url + '/' + id,
			dataType: 'json',
			beforeSend : function( xhr ) {
				xhr.setRequestHeader( 'Authorization', 'Bearer ' + api_key );
			},
			success: function( data ) {
				$( '#quote-input' ).val( data.fields.Content );
				$( '#author-edit').val( data.fields.Author );
				$( '#title-edit' ).val( data.fields.Title );

				if ( data.fields.posts ) {
					var posts = JSON.parse( data.fields.posts );
					$.each( posts, function( key, value ) {
						var postURL = 'https://wordpress.com/post/' + localStorage.getItem( 'wpcom-site-id' ) + '/' + value;
						$( '#post-list' ).prepend( "<a class='btn btn-default' href='" + postURL + "'>Edit post: " + key + "</a>" );
					} )
				}
				updateTitleAndAuthor();
				linkifyQuote();
			},
			error: function( jqXHR, textStatus, errorThrown ) {
				var errorDiv = '<div class="alert alert-danger" role="alert">Error loading quote: ' + errorThrown + '</div>';
				$( '#alert-header' ).replaceWith( errorDiv );
			}
		} );
	}

	function deleteAirtableRecord( id ) {
		if ( ! confirm( "are you sure you want to delete this record?" ) ) {
			return;
		}

		var id = window.location.search.split( '=' )[1];
		if ( ! id ) { return; }

		var url = $( '#airtable-prefix' ).text() + localStorage.getItem( "airtable-url" );

		$.ajax( {
			url: url + '/' + id,
			method: 'DELETE',
			dataType: 'json',
			beforeSend : function( xhr ) {
				xhr.setRequestHeader( 'Authorization', 'Bearer ' + localStorage.getItem( "airtable-key" ) );
			},
			success: function( data ) {
				alert( "record deleted" );
				document.location.href = './';
			},
			error: function( jqXHR, textStatus, errorThrown ) {
				alert( "error deleting: " + textStatus );
			}
		} );
	}

	function updateAirtableRecord() {

	}

	var id = window.location.search.split( '=' )[1];
	if ( id ) {
		loadAirtableRecord( id );
		$( '#delete-record' ).click( deleteAirtableRecord );
	}

	/* title and author editing */
	function cancelMetaEdit() {
		$( '#book-meta-edit' ).hide();
		$( '#book-meta' ).show();	
	}

	function updateTitleAndAuthor() {
		$( '#author' ).html( $( '#author-edit' ).val() );
		$( '#title' ).html( $( '#title-edit' ).val() );

		cancelMetaEdit();
		findBookInfo();
	}


	/* Goodreads search for book info */
	function findBookInfo() {
		var title = $( '#title-edit' ).val(),
		    author = $( '#author-edit' ).val(),
		    yqlURL = "https://query.yahooapis.com/v1/public/yql",
			api_key = localStorage.getItem( 'goodreads-key' );

		if ( ! api_key ) {
			var settingsLink = "<a href='#settings' data-toggle='modal'>settings</a>",
			    message = "Missing Goodreads API key; check " + settingsLink + ".",
			    errorDiv = '<div class="alert alert-danger" role="alert">' + message + '</div>';
			$( '#goodreads-results' ).html( errorDiv );
			return;
		}

		var goodreadsURL = "https://www.goodreads.com/search/index.xml?key=" + api_key + "&q=" + encodeURIComponent( title + "+" + author );

		var args = {
			q: "select * from xml where url=\""+goodreadsURL+"\"",
			format: 'json'
		};

		$( '#goodreads-results' ).empty();

		$.ajax( {
			url: yqlURL,
			data: args,
			dataType: 'json',
			success: function( data ) {
				var numResults = data.query.results.GoodreadsResponse.search['total-results'];
				var results = data.query.results.GoodreadsResponse.search.results.work;

				$( '#goodreads-results' ).empty();

				if( numResults == 0 ) {
					var message = "No results found :(  Adjust title and/or author to try again.",
					    errorDiv = '<div class="alert alert-warning" role="alert">' + message + '</div>';
					$( '#goodreads-results' ).html( errorDiv );
					return;

					// @todo: add ability to paste custom Goodreads URL if no results found
				}
				else if( numResults == 1 ) {
					var div = bookCard( results.best_book );
					$( '#goodreads-results' ).html( div );
				} else {
					results.forEach( function( result ) {
						var div = bookCard( result.best_book );
						$( '#goodreads-results' ).append( div );
					} );
				}
				$( '#goodreads-results' ).find( 'button.book-card' ).click( function( e ) {
					$( '#goodreads-results' ).find( 'button.book-card' ).toggle();
					$( e.currentTarget ).toggleClass( 'selected' ).show();
					$( '#goodreads-results-header' ).toggle();
					maybeShowPreviewButton();
				} );
			}
		} );
	}

	function bookCard( book ) {
		var url = "https://www.goodreads.com/book/show/" + book.id.content,
		    textlink = "<span class='glyphicon glyphicon-link'></span> <a href='" + url + "'>" + url + "</a>",
		    img = '<a href="' + url + '"><img class="media-object img-thumbnail" src="' + book.small_image_url + '" /></a>',
		    title = '<div class="media-heading"><h5>' + book.title + '</h5></div>',
		    author = '<p>' + book.author.name + '</p>' + textlink ,
		    caption = title + author,
		    div = '<div class="media"><div class="media-left">' + img + '</a></div><div class="media-body">' + caption + '</div></div>';
		return '<button class="book-card list-group-item">' + div + '</button>';
	}


	/* highlight words */
	function linkifyQuote() {
		var quote = $( "#quote-input" ).val(),
		    linkifiedQuote = '',
		    words = quote.split( ' ' );

		// linkify every word
		words.forEach( function( e ) {

			// strip off punctuation
			var punctuation = [ ',', '.', '"', '\u201C', '\u201D', '?', '-', '\u2026', '\u2013', '\u2014' ];

			var endPunctuation = '';
			while ( $.inArray( e[ e.length-1 ], punctuation ) !== -1 ) {
				endPunctuation = e[ e.length-1 ] + endPunctuation;
				e = e.substr( 0, e.length-1 );
			}

			var beginningPunctuation = '';
			while ( $.inArray( e[0], punctuation ) !== -1 ) {
				beginningPunctuation += e[0];
				e = e.substr( 1 );
			}

			// sometimes emdashes are in the middle of words
			var hyphened = e.split( '\u2014' );
			

			// skip numbers
			if ( $.isNumeric( e ) ) {
				linkifiedQuote += ' ' + beginningPunctuation + e + endPunctuation;
				return;
			}

			linkifiedQuote += " " + beginningPunctuation + "<a href='' class='wordlink'>" + e + "</a>" + endPunctuation;
		} );

		// replace textarea with blockquote
		$( '#quote-input' ).hide();
		$( '#formatted-quote' ).html( linkifiedQuote ).show();
		$( '.wordlink' ).click( highlightWord );

		$( '#step-1' ).show();
		$( '#step-2' ).show();
	}

	function highlightWord( e ) {
		e.preventDefault();
		var word = e.target.innerHTML;
		$( '#formatted-quote' ).find( '.selected' ).removeClass( 'selected' );
		$( e.target ).addClass( 'selected' );
		$( '#selected-word' ).text( word );

		wordnikLookup( word );
	}

	function wordnikLookup( word ) {
		var api_key = localStorage.getItem( 'wordnik-key' );

		if ( ! api_key ) {
			var settingsLink = "<a href='#settings' data-toggle='modal'>settings</a>",
			    message = "Missing Wordnik API key; check " + settingsLink + ".",
			    errorDiv = '<div class="alert alert-danger" role="alert">' + message + '</div>';
			$( '#word-definitions' ).html( errorDiv ).show();
			return;
		}

		// clear any previous results
		$( '#word-definitions' ).empty();

		// singularize
		var baseWord = pluralize( word, 1 );
		var baseURL = "http://api.wordnik.com:80/v4/word.json/" + baseWord + "/definitions";
		
		var args = {
			limit: 200,
			includeRelated: false,
			sourceDictionaries: 'all',
			useCanonical: true,
			includeTags: false,
			api_key: api_key
		};

		$.ajax( {
			url: baseURL,
			data: args,
			dataType: 'json',
			success: function( data ) {
				if ( data.length === 0 ) {
					// @todo: Add Google search results (API?) or Wikipedia link/results?
					var googleLink = "<a href='https://www.google.com/search?q='" + baseWord + "'>Go to Google</a>",
					    message = "No definitions found. " + googleLink + ".",
					    errorDiv = '<div class="alert alert-warning" role="alert">' + message + '</div>';
					$( '#word-definitions' ).html( errorDiv ).show();
					return;

					// @todo: add ability to paste custom definition + source attribute if no definitions found (or even if they are?)
				}
				data.forEach( function( definition ) {
					$( '#selected-word' ).text( definition.word );
					var partOfSpeech = '<em>(' + definition.partOfSpeech + ')</em>';
					var attribution = '<span class="attribution"><small>' + definition.attributionText + '</small></span>';
					$( '#word-definitions' ).append( '<button class="word-definition list-group-item">' + partOfSpeech + ' <span class="definition">' + definition.text + '</span><br />' + attribution + '</button>' );
				} );
				$( '#word-definitions' ).show();
				$( '#word-definitions' ).find( 'button.word-definition' ).click( function( e ) {
					$( '#word-definitions' ).find( 'button.word-definition' ).toggle();
					$( e.currentTarget ).toggleClass( 'selected' ).show();
					maybeShowPreviewButton();
				} );
			}
		} );
	}

	function maybeShowPreviewButton() {
		if ( ( $( '#word-definitions' ).find( 'button.selected' ).length === 1 )
			&& ( $( '#goodreads-results' ).find( 'button.selected' ).length === 1 ) ) {
				$( '#preview-post' ).prop( 'disabled', '' );
		} else {
			$( '#preview-post' ).prop( 'disabled', 'disabled' );
		}
	}

	function buildWPPost() {
		var title = $( '#selected-word' ).text(),
			selected_definition = $( '#word-definitions' ).find( 'button.selected' ),
		    definition = selected_definition.find( '.definition' ).text(),
		    wordnik_link = '(via <a href="https://wordnik.com/words/' + title + '">Wordnik</a>)',
		    attribution = selected_definition.find( '.attribution' ).text(),
		    source = $( '#goodreads-results' ).find( 'button.selected' ).text(),
		    goodreads_link = $( '#goodreads-results' ).find( 'button.selected' ).find( 'a' ).attr( 'href' ),
		    quote_content = $( '#quote-input' ).val(),
		    book_title = $( '#title' ).text(),
		    author = $( '#author' ).text(),
		    publicize_message = title + ' - ' + definition;


		// @todo pull book title from Goodreads info, not edit box?

		var content = "<p>" + definition + "</p>"
		            + "<blockquote>" + quote_content
		            + "<footer><cite>" + author + ", "
		            + "<a href='" + goodreads_link + "'>" + book_title + "</a></cite></footer></blockquote>"
		            + "<p><small> Definition " + attribution
		            + " " + wordnik_link + "</small></p>";

		data = { title: title,
			     content: content,
			     status: 'draft',
			     publicize_message: publicize_message,
			     tags: author,
			     fields: 'ID'
			   };

		makeWordPressPost( data );
	}
	$( '#preview-post' ).click( buildWPPost );

	function makeWordPressPost( postData ) {
		jQuery.ajax( {
			url: 'https://public-api.wordpress.com/rest/v1.1/sites/' + localStorage.getItem( 'wpcom-site-id' ) + '/posts/new',
			type: 'POST',
			data: postData,
			beforeSend : function( xhr ) {
			    xhr.setRequestHeader( 'Authorization', 'BEARER ' + localStorage.getItem( 'wpcom-auth-token' ) );
			},
			success: function( response ) {
				var posts = {};
				posts[ response.title ] = response.ID;

				// add a view post button
				var postURL = 'https://wordpress.com/post/' + localStorage.getItem( 'wpcom-site-id' ) + '/' + response.ID;
				$( '#post-list' ).prepend( "<a class='btn btn-default' href='" + postURL + "'>Edit post: " + response.title + "</a>" );

				console.log( posts );

				// @todo save postID back to Airtable record
				// updateAirtableRecord( posts );
				console.log( response );
			}
		} );		
	}

});