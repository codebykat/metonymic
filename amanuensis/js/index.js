jQuery( function($) {

	if ( ! localStorage.getItem( 'wpcom-auth-token' ) ) {
		// bail
		return;
	}

	// add progress bar
	$( '#navbar' ).append(
		$( document.createElement( "div" ) )
			.addClass( "progress" )
			.append( $( document.createElement( "div" ) )
				.attr( "id", "progress-bar" )
				.addClass( "progress-bar progress-bar-info" )
				.attr( "role", "progressbar" )
				.attr( "data-requested", "0" )
				.attr( "aria-valuenow", "0" )
				.attr( "aria-valuemin", "0" )
				.attr( "aria-valuemax", "100" )
				.append( $( document.createElement( "span" ) )
					.addClass( "sr-only" )
					.text( "0% complete" )
				)
			)
	);

	// add filters to navbar
	$( '#navbar-open' )
		.append( $( document.createElement( "button" ) )
			.attr( "id", "author-filter" )
			.addClass( "btn btn-default btn-md navbar-btn" )
			.css( "display", "none" )
			.append( $( document.createElement( "span" ) )
				.attr( "id", "author-filter-value" )
			)
			.append( $( document.createElement( "a" ) )
				.attr( "href", "#" )
				.addClass( "remove-filter" )
				.append( $( document.createElement( "span" ) )
					.addClass( "glyphicon glyphicon-remove" )
				)
			)
		)
		.append( $( document.createElement( "button" ) )
			.attr( "id", "title-filter" )
			.addClass( "btn btn-default btn-md navbar-btn" )
			.css( "display", "none" )
			.append( $( document.createElement( "span" ) )
				.attr( "id", "title-filter-value" )
			)
			.append( $( document.createElement( "a" ) )
				.attr( "href", "#" )
				.addClass( "remove-filter" )
				.append( $( document.createElement( "span" ) )
					.addClass( "glyphicon glyphicon-remove" )
				)
			)
		);

	// refresh records list on settings update
	$( "#save-settings" ).click( function() {
		$( '#quote-list' ).empty();
		$( '#results-count' ).text( 0 );
		$( '#alert-header' ).empty();
		getQuotesFromAirtable();
	} );

	function getQuotesFromAirtable( offset ) {
		var url = localStorage.getItem( "airtable-url" ),
		    api_key = localStorage.getItem( "airtable-key" );

		if ( ! url || ! api_key ) {
			var settingsLink = "<a href='#settings' data-toggle='modal'>settings</a>";
			var message = "Can't load quotes; check " + settingsLink + ".",
			    errorDiv = '<div class="alert alert-danger" role="alert">' + message + '</div>';
			$( '#alert-header' ).html( errorDiv );
			return;
		}

		url = $( '#airtable-prefix' ).text() + url;

		if ( ! offset ) {
			// first page, reset results
			$( '#results-count' ).text( 0 );
		}

		var args = {
			sortField: 'Created',
			api_key: api_key,
			limit: 100,
			offset: offset
		};

		$( '#progress-bar' ).data( 'requested', $( '#progress-bar' ).data( 'requested' ) + 100 );
		updateProgressBar();

		$.ajax( {
			url: url,
			data: args,
			dataType: 'json',
			success: function( data ) {
				var results = [];
				data.records.forEach( function( result ) {
					results.push( result );
				} );

				renderResults( results );
				updateProgressBar();

				if( data.offset ) {
					getQuotesFromAirtable( data.offset );
				} else {
					// last page, adjust progress bar accordingly
					$( '#progress-bar' ).data( 'requested', $( '#results-count' ).text() );
					updateProgressBar();
					$( '.progress' ).css( { 'visibility': 'hidden' } );

					// save count to localStorage
					localStorage.inboxCount = $( '#results-count' ).text();

					// done loading, add click handlers
					$( '#quote-list' ).find( 'button.author' ).click( filterByAuthor );
					$( '#quote-list' ).find( 'button.title' ).click( filterByTitle );
				}
			},
			error: function( jqXHR, textStatus, errorThrown ) {
				var errorDiv = '<div class="alert alert-danger" role="alert">Error loading quotes: ' + errorThrown + '</div>';
				$( '#alert-header' ).html( errorDiv );
			}
		} );
	}

	function updateProgressBar() {
		var count = $( '#results-count' ).text(),
		    requested = $( '#progress-bar' ).data( 'requested' ),
		    width = ( count / requested ) * 100;
		$( '#progress-bar' ).css( 'width', width + '%' );
		$( '#progress-bar' ).attr( 'aria-valuenow', width ).attr( 'aria-valuemax', requested );
		$( '#progress-bar .sr-only' ).html( width + '% complete' );
	}

	function renderResults( results ) {
		$( '#results-count' ).text( parseInt( $( '#results-count' ).text() ) + results.length );

		results.forEach( function( result ) {
			var quote = "<div class='panel-body'>" + result.fields.Content + "</div>",
			    link = "<a href='add.html?id=" + result.id + "'>" + quote + "<span class='glyphicon glyphicon-share'></span></a>",
			    author = "<button type='button' class='author btn btn-default btn-sm'>" + result.fields.Author + "</button>",
			    title = "<button type='button' class='title btn btn-default btn-sm'>" + result.fields.Title + "</button>",
			    date = moment( result.fields.Created ),
			    created = "<br /><small>" + date.fromNow() + " (" + date.format( 'M/DD/YYYY HH:mm' ) + ")</small>",
			    meta = "<div class='quote-meta panel-footer'>" + author + title + created + "</div>",
			    classes = "quote panel panel-default",
			    datatags = " data-id='" + result.id + "' data-author='" + result.fields.Author.toLowerCase() + "' data-title='" + result.fields.Title.toLowerCase() + "'";

			$( '#quote-list' ).append( "<div class='col-md-4'><div class='" + classes + "'" + datatags + ">" + link + meta + "</div></div>" );
		} );
	}

	function filterByAuthor( e ) {
		e.preventDefault();
		$( '#author-filter' ).data( 'value', e.target.childNodes[0].nodeValue );
		doFilter();
	}

	function filterByTitle( e ) {
		e.preventDefault();
		$( '#title-filter' ).data( 'value', e.target.childNodes[0].nodeValue );
		doFilter();
	}

	$( '.remove-filter' ).click( function( e ) {
		e.preventDefault();
		$( e.target ).closest( 'button' ).data( 'value', '' );
		doFilter();
	} );

	function doFilter() {
		console.time("doFilter");

		var author = $( '#author-filter' ).data( 'value' ),
			title = $( '#title-filter' ).data( 'value' );

		$( '#quote-list' ).find( 'div.col-md-4' ).css( { 'display': '' } );

		if( author ) {
			$( '#quote-list' ).find( 'div.quote' )
			    .not( '[data-author="' + author.toLowerCase() + '"]' )
			    .parent()
			    .css( { 'display': 'none' } );
			$( '#author-filter-value' ).html( author ).show();
			$( '#author-filter' ).show();
		} else {
			$( '#author-filter' ).hide();
		}

		if( title ) {
			$( '#quote-list' ).find( 'div.quote' )
			    .not( '[data-title="' + title.toLowerCase() + '"]' )
			    .parent()
			    .css( { 'display': 'none' } );
			$( '#title-filter-value' ).html( title ).show();
			$( '#title-filter' ).show();
		} else {
			$( '#title-filter' ).hide();
		}

		$( '#results-count' ).text( $( '#quote-list' ).find( 'div.col-md-4:visible' ).length );
		console.timeEnd("doFilter");
	}

	getQuotesFromAirtable();	
});