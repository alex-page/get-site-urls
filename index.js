/*
 *
 * GetSiteUrls - Get all of the URL's from a website 🔗
 *
 */


// ------------
// Dependencies
// ------------
const Got = require( 'got' );
const NormalizeUrl = require( 'normalize-url' );


/**
 * CleanURL - Clean the URL with normalize-url
 *
 * @param   {string} url - A url to clean up
 * @returns {string}     - A clean url
 */
const CleanUrl = url => NormalizeUrl( url, {
	stripHash:             true,
	removeQueryParameters: [ new RegExp( '.*' ) ],
});


/**
 * GetLinks - Get all of the URL's from an array of strings
 *
 * @param  {array}  data        - The pages body
 * @param  {string} pageUrl     - The page we are searching for links
 * @param  {string} siteUrl     - The website we are searching
 *
 * @return {array}        - An array of links found
 */
const GetLinks = ( data, pageUrl, siteUrl ) => {
	// Regex link pattern
	const linkPattern = /(?!.*mailto:)(?!.*tel:).<a[^>]+href="(.*?)"/g;
	const links = [];
	let result = true;

	// While there is a string to search
	while( result ) {
		// Search the string using the regex pattern
		result = linkPattern.exec( data );

		// If there is no result then end the search
		if( result === null ) {
			result = false;
			break;
		}

		const link = result[ 1 ];

		// If the link already starts with the URL
		if( link.startsWith( siteUrl ) ) {
			links.push( CleanUrl( link ) );
		}
		// Otherwise make sure it is relative or absolute
		else if( !link.startsWith( 'http' ) && !link.startsWith( 'https' )
		) {
			const pageLink = link.startsWith( '/' )
				? `${ siteUrl }${ link }`
				: `${ pageUrl }/${ link }`;

			links.push( CleanUrl( pageLink ) );
		}
	}

	// Return the links
	return links;
};

/**
 * SearchSite - Fetch all of the URL's from a website 🔗
 *
 * @param {string} siteUrl    - The URL we are searching
 * @param {number} maxDepth   - The maximum depth it should crawl
 * @param {object} pages      - The found pages, error pages and next pages in queue
 * @param {number} depth      - The current crawl depth
 * @param {string} auth       - Basic authentication if provided
 *
 * @return {array}            - An array of links found
 */
const SearchSite = async ( siteUrl, maxDepth, pages, depth, auth ) => {
	// For each url fetch the page data
	const getLinks = [ ...pages.queue ].map( async ( url ) => {
		// Delete the URL from queue
		pages.queue.delete( url );

		try {
			// Add authentication if it is defined
			const gotOptions = auth ? { auth } : {};

			// Get the page header so we can check the type is text/html
			const { headers } = await Got.head( url, gotOptions );

			// If it is a HTML page get the body and search for links
			if( headers[ 'content-type' ].includes( 'text/html' ) ) {
				const { body } = await Got( url, gotOptions );

				// Add to found as it is a HTML page
				pages.found.add( url );

				// Add the unique links to the queue
				GetLinks( body, url, CleanUrl( siteUrl ) ).forEach( ( link ) => {
					// If the link is not in error or found add to queue
					if( !pages.found.has( link ) && !pages.errors.has( link ) ) {
						pages.queue.add( link );
					}
				});
			}
		}
		catch( error ) {
			pages.errors.add( url );
		}
	});

	await Promise.all( getLinks );

	// If we have reached maximum depth or the queue is empty
	// maxDepth + 1 as the first page doesn't count
	if( depth === maxDepth || pages.queue.size === 0 ) {
		return {
			pages:  [ ...pages.found ],
			errors: [ ...pages.errors ],
		};
	}

	// Start the search again as the queue has more to search
	return SearchSite( siteUrl, maxDepth, pages, depth + 1, auth );
};


/**
 * GetSiteUrls - Fetch all of the URL's from a website 🔗
 *
 * @param {string} siteUrl    - The URL we are searching
 * @param {number} maxDepth   - The maximum depth it should crawl
 *
 * @return {array}            - An array of links found
 */
const GetSiteUrls = ( siteUrl, maxDepth = 100 ) => {
	const { username, password } = new URL( siteUrl );

	const pages = {
		queue:  new Set( [ CleanUrl( siteUrl ) ] ),
		found:  new Set( [] ),
		errors: new Set( [] ),
	};

	const depth = 0;
	const auth = username && password ? `${ username }:${ password }` : '';

	return SearchSite( CleanUrl( siteUrl ), maxDepth, pages, depth, auth );
};


// Export the default module
module.exports = GetSiteUrls;

// Export the functions for testing
module.exports.CleanUrl = CleanUrl;
module.exports.GetLinks = GetLinks;
