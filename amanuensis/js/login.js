var development_client_id = 34284,
    production_client_id = 44575,
    client_id = production_client_id;

if ( window.location.hostname === "localhost" ) {
	client_id = development_client_id;
}
window.loginURL = "https://public-api.wordpress.com/oauth2/authorize?client_id=" + client_id + "&response_type=token";

jQuery( function($) {

	// save WPCOM auth token if it was returned
	if ( window.location.hash !== '' ) {
		var recd = window.location.hash.substr( 1 ).split( '&' );
		var params = [];
		recd.forEach( function( item ) {
			var split = item.split( '=' );
			params[ decodeURIComponent( split[0] ) ] = decodeURIComponent( split[1] );
		} );
		localStorage.setItem( 'wpcom-auth-token', params[ 'access_token' ] );
		localStorage.setItem( 'wpcom-site-id', params[ 'site_id' ] );

		// clear hash
		history.replaceState( "", document.title, window.location.pathname + window.location.search );
	}

	function logout() {
		localStorage.removeItem( 'wpcom-auth-token' );
		localStorage.removeItem( 'wpcom-site-id' );
		localStorage.removeItem( 'wpcom-site-url' );
		localStorage.removeItem( 'wpcom-site-name' );

		if ( ! document.URL.endsWith( 'login.html' ) ) {
			window.location.href = 'login.html';
		}
	}

	function validateWPCOMAuthToken() {
		if ( ! localStorage.getItem( 'wpcom-auth-token' ) ) {
			if ( ! document.URL.endsWith( 'login.html' ) ) {
				window.location.href = 'login.html';
			}
		}
		var me_url = "https://public-api.wordpress.com/rest/v1.1/me";

		$.ajax( {
			url: me_url,
			dataType: 'json',
			beforeSend : function( xhr ) {
				xhr.setRequestHeader( 'Authorization', 'BEARER ' + localStorage.getItem( 'wpcom-auth-token' ) );
			},
			success: function( data ) {
				// only one particular user has admin rights :)
				if ( data.ID !== 28288641 ) {
					logout();
				}
				// everything checks out
				if ( document.URL.endsWith( 'login.html' ) ) {
					window.location.href = 'index.html';
				}
			},
			error: function() {
				// presumably the token is no longer valid, so let's delete the info and start over
				logout();
			}
		} );
	}

	window.amanuensisLogout = logout;
	validateWPCOMAuthToken();
} );