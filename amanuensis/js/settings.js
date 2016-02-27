jQuery( function($) {

	if ( localStorage.getItem( 'wpcom-site-id' ) ) {
		var url = "https://public-api.wordpress.com/rest/v1.1/sites/" + localStorage.getItem( 'wpcom-site-id' );
		$.ajax( {
			url: url,
			dataType: 'json',
			success: function( data ) {
				localStorage.setItem( 'wpcom-site-url', data.URL );
				localStorage.setItem( 'wpcom-site-name', data.name );

				// update settings panel
				$( "#wpcom-auth-section" ).replaceWith( createWPCOMAuthSection() );
			},
		} );
	}

	// add settings cog to navbar
	$( "#navbar-open" ).append( $( document.createElement( "ul" ) )
		.addClass( "nav navbar-nav navbar-right" )
		.append( $( document.createElement( "li" ) )
			.append( $( document.createElement( "a" ) )
				.attr( "href", "#settings" )
				.attr( "data-toggle", "modal" )
				.append( $( document.createElement( "span" ) )
					.addClass( "glyphicon glyphicon-cog" )
				)
			)
		)
	);

	// add modal to body
	$( "body" ).append( $( document.createElement( "div" ) )
		.attr( "id", "settings" )
		.addClass( "modal" )
		.append( $( document.createElement( "div" ) )
			.addClass( "modal-dialog" )
			.append( $( document.createElement( "div" ) )
				.addClass( "modal-content" )
				.append( $( document.createElement( "div" ) )
					.addClass( "modal-header" )
					.append( $( document.createElement( "button" ) )
						.attr( "type", "button" )
						.addClass( "close" )
						.attr( "data-dismiss", "modal" )
						.attr( "aria-label", "Close" )
						.html(
							'<span aria-hidden="true">&times;</span>'
						)
					)
					.append( $( document.createElement( "h4" ) )
						.addClass( "modal-title" )
						.text( "Settings" )
					)
				)
				.append( $( document.createElement( "div" ) )
					.addClass( "modal-body" )
					.append( $( document.createElement( "form" ) )
						.append( createFormGroup( "airtable-key", "Airtable API Key ", "https://airtable.com/account" ) )
						.append( $( document.createElement( "div" ) )
							.addClass( "form-group" )
							.append( $( document.createElement( "label" ) )
								.attr( "for", "airtable-url" )
								.addClass( "control-label" )
								.text( "Airtable URL" )
							)
							.append( $( document.createElement( "div" ) )
								.addClass( "input-group" )
								.append( $( document.createElement( "span" ) )
									.attr( "id", "airtable-prefix" )
									.addClass( "input-group-addon" )
									.text( "https://api.airtable.com/v0/" )
								)
								.append( $( document.createElement( "input" ) )
									.attr( "id", "airtable-url" )
									.attr( "type", "text" )
									.addClass( "form-control" )
									.val( localStorage.getItem( "airtable-url" ) )
								)
							)
						)
						.append( createFormGroup( "goodreads-key", "Goodreads API Key ", "https://www.goodreads.com/api/keys" ) )
						.append( createFormGroup( "wordnik-key", "Wordnik API Key ", "https://wordnik.com/users/edit" ) )
						.append( createWPCOMAuthSection() )
					)
				)
				.append( $( document.createElement( "div" ) )
					.addClass( "modal-footer" )
					.append( $( document.createElement( "button" ) )
						.attr( "id", "logout" )
						.attr( "type", "button" )
						.attr( "data-dismiss", "modal" )
						.addClass( "btn btn-link pull-left" )
						.text( "Log Out" )
						.click( window.amanuensisLogout )
					)
					.append( $( document.createElement( "button" ) )
						.attr( "type", "button" )
						.attr( "data-dismiss", "modal" )
						.addClass( "btn btn-default" )
						.text( "Close" )
					)
					.append( $( document.createElement( "button" ) )
						.attr( "id", "save-settings" )
						.attr( "type", "button" )
						.attr( "data-dismiss", "modal" )
						.addClass( "btn btn-primary" )
						.text( "Save" )
					)
				)
			)
		)
	);

	function createFormGroup( id, label, link ) {
		return ( $( document.createElement( "div" ) )
			.addClass( "form-group" )
			.append( $( document.createElement( "label" ) )
				.attr( "for", id )
				.addClass( "control-label" )
				.text( label )
				.append( function() { return link != '' ? $( document.createElement( "a" ) )
					.attr( "href", link )
					.append( $( document.createElement( "span" ) )
						.addClass( "glyphicon glyphicon-link" )
					) :  '' }
				)
			)
			.append( $( document.createElement( "input" ) )
				.attr( "id", id )
				.attr( "type", "text" )
				.addClass( "form-control" )
				.val( localStorage.getItem( id ) )
			)
		)
	}

	function createWPCOMAuthSection() {
		var connected = ( localStorage.getItem( "wpcom-auth-token" ) != null );

		return( $( document.createElement( "div" ) )
			.attr( "id", "wpcom-auth-section" )
			.addClass( "form-group" )
			.append( $( document.createElement( "label" ) )
				.attr( "for", "wpcom-auth-token" )
				.addClass( "control-label" )
				.text( "WPCOM oAuth " )
			)
			.append( $( document.createElement( "div" ) )
				.attr( "id", "wpcom-auth-token" )
				.addClass( "well" )
				.text( function() { return connected ? "connected " : "disconnected " } )
				.append( $( document.createElement( "a" ) )
					.attr( "href",
						"https://public-api.wordpress.com/oauth2/authorize?client_id=44575"
						+ "&redirect_uri=" + encodeURIComponent( document.location.href + '?wpcom=' )
						+ "&response_type=token"
					)
					.append( $( document.createElement( "span" ) )
						.addClass( function() { return connected ? "glyphicon glyphicon-refresh" : "glyphicon glyphicon-new-window" } )
					)
				)
				.append( $( document.createElement( "div" ) )
					.append( $( document.createElement( "img" ) )
						.attr( 'src', 'img/wpmini-blue.png' )
						.addClass( 'pull-left img-thumbnail' )
					)
					.append( $( document.createElement( "div" ) )
						.append( $( document.createElement( "a" ) )
							.attr( 'href', localStorage.getItem( 'wpcom-site-url' ) )
							.text( localStorage.getItem( 'wpcom-site-name' ) )
						)
					)
				)
			)
		);
	}

	// save all settings to localStorage with the same ID
	$( "#save-settings" ).click( function() {
		$( "#settings" ).find( 'input' ).each( function( idx, elem ) {
			localStorage.setItem( elem.id, $( elem ).val() );
		} );
	} );

});