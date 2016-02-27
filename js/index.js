jQuery( function() {
	var wp_url = 'https://public-api.wordpress.com/rest/v1.1/sites/metonymicautodidactic.wordpress.com/posts';
	var options = { number: 100, order: 'ASC', order_by: 'title', fields: 'title,URL' };

	function showPosts( data ) {
		data.posts.forEach( function( post ) {
			var first_letter = post.title[0].toUpperCase();
			var link = '<a href="' + post.URL + '">' + post.title + '</a>';
			var element = '<li>' + link + '</li>';
			var list = $( '#word-group-' + first_letter );

			if( list.length === 0 ) {
				var first_letter_col = '<div class="col-xs-1 col-xs-offset-1 col-sm-offset-2 col-md-offset-3 letter">' + first_letter + '</div>';
				var list = '<ul class="word-group" id="word-group-' + first_letter + '">' + element + '</ul>';
				var list_col = '<div class="col-xs-9 col-sm-4 col-sm-offset-1 col-md-offset-1 col-lg-offset-1">' + list + '</div>';
				var row = '<div class="row">' + first_letter_col + list_col + '</div>';
				$( '#posts' ).append( row );
			} else {
				list.append( element );
			}
		} );
		// make requests until we run out of posts
		if( data.meta.next_page ) {
			options.page_handle = data.meta.next_page;
			$.get( wp_url, options, showPosts, 'json' );
		} else {
			// done loading
			$( '#spinner' ).hide();
		}
	}

	// @todo: cache results in localStorage
	// @todo: do not make a request if data is recent
	// @todo: handle errors
	jQuery.get( wp_url, options, showPosts, 'json' );
} );