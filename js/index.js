jQuery( function() {
	var wp_url = 'https://public-api.wordpress.com/wp/v2/sites/metonymicautodidactic.wordpress.com/posts'
	var page_number = 1;
	var posts_per_page = 100;
	var options = { per_page: posts_per_page, order: 'asc', orderby: 'title' };

	function showPosts( data, result, xhr ) {
		var total_pages = xhr.getResponseHeader("X-WP-TotalPages");
		data.forEach( function( post ) {
			var first_letter = post.title.rendered[0].toUpperCase();
			var link = '<a href="' + post.link + '">' + post.title.rendered + '</a>';
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
		if( page_number < total_pages ) {
			options.offset = posts_per_page * page_number;
			page_number += 1;
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