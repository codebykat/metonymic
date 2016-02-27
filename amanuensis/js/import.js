jQuery( function($) {

	// update navbar
	$( '#results-count' ).html( localStorage.inboxCount );

	function loadDataFromEvernote() {
		var url = "https://sandbox.evernote.com/shard/s1/notestore" + ;
		var args = {
			api_key: 'S=s1:U=91ee1:E=15984c6582d:C=1522d152ae0:P=1cd:A=en-devtoken:V=2:H=b3c566ba7c20a0a24277454bebd1b794'
		};

		// @TODO get readonly Evernote auth token instead

		$.ajax( {
			url: url,
			data: args,
			dataType: 'json',
			success: function( data ) {
				$( '#quote-input' ).val( data.fields.Content );
				$( '#author-edit').val( data.fields.Author );
				$( '#title-edit' ).val( data.fields.Title );
				updateTitleAndAuthor();
				linkifyQuote();
			},
			error: function( jqXHR, textStatus, errorThrown ) {
				var errorDiv = '<div class="alert alert-danger" role="alert">Error loading quote: ' + errorThrown + '</div>';
				$( '#alert-header' ).replaceWith( errorDiv );
			}
		} );
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
		var title = $( '#title-edit' ).val();
		var author = $( '#author-edit' ).val();

		var goodreadsURL = "https://www.goodreads.com/search/index.xml?key=Md60KMku9gmWk4lzGvBJqw&q=" + encodeURIComponent( title + "+" + author );
		var yqlURL = "https://query.yahooapis.com/v1/public/yql";

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
					$( '#goodreads-results' ).html( 'No results found :(  Adjust title and/or author to try again.' );
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
					$( '#goodreads-results' ).css( { 'height': 'auto', 'overflow-y': 'auto' } )
					    .find( 'button.book-card' ).css( { 'display': 'none' } );
					$( e.currentTarget ).css( { 'display': '' } );
					$( '#goodreads-results-header' ).html('');
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
			var storedPunctuation = '';
			if ( e[ e.length-1 ] === ',' ) {
				e = e.substr( 0, e.length-1 );
				storedPunctuation = ',';
			}
			if ( e[ e.length-1 ] === '.' ) {
				e = e.substr( 0, e.length-1 );
				storedPunctuation = '.';
			}

			// skip numbers
			if ( $.isNumeric( e ) ) {
				linkifiedQuote += ' ' + e + storedPunctuation;
				return;
			}

			linkifiedQuote += " <a href='' class='wordlink' id='" + e + "'>" + e + "</a>" + storedPunctuation;
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
		$( '.selected' ).removeClass( 'selected' );
		$( e.target ).addClass( 'selected' );
		$( '#selected-word' ).html( word );

		wordnikLookup( word );
	}

	function wordnikLookup( word ) {
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
			api_key: '3ad96ae4793c87bc7e5070f08400dbd11edf9fc970f642584'
		};

		$.ajax( {
			url: baseURL,
			data: args,
			dataType: 'json',
			success: function( data ) {
				if ( data.length === 0 ) {
					// @todo: Add Google search results (API?) or Wikipedia link/results?
					$( '#word-definitions' ).html( 'No definitions found. <a href="https://www.google.com/search?q=' + baseWord + '">Go to Google</a>.' );
					// @todo: add ability to paste custom definition + source attribute if no definitions found (or even if they are?)
				}
				data.forEach( function( definition ) {
					$( '#selected-word' ).html( definition.word );
					var partOfSpeech = '<i>(' + definition.partOfSpeech + ')</i>';
					var attribution = '<small>' + definition.attributionText + '</small>';
					var attribution = '<small>' + definition.sourceDictionary + '</small>';
					$( '#word-definitions' ).append( '<button class="word-definition list-group-item">' + partOfSpeech + ' ' + definition.text + ' ' + attribution + '</button>' );
				} );
				$( '#word-definitions' ).show();
				$( '#word-definitions' ).find( 'button.word-definition' ).click( function( e ) {
					var target = $( e.currentTarget );
					// @todo - if clicked a second time, restore the other panels, undo the below
					$( '#word-definitions' ).css( { 'height': 'auto', 'overflow-y': 'auto' } )
					    .find( 'button.word-definition' ).css( { 'display': 'none' } );
					target.css( { 'display': '' } );
				} );
			}
		} );
	}

});