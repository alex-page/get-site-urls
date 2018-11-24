/*
 *
 * index.js - Where the magic happens
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
 * GetSiteUrls - Fetch all of the URL's from a website 🔗
 *
 * @param {string} siteUrl    - The URL we are searching
 * @param {number} maxDepth   - The maximum depth it should crawl
 * @param {object} pages      - The found pages, error pages and next pages in queue
 * @param {number} depth      - The current crawl depth
 *
 * @return {array}            - An array of links found
 */
const GetSiteUrls = async (
	siteUrl,
	maxDepth = 100,
	pages = {
		queue:  new Set( [ CleanUrl( siteUrl ) ] ),
		found:  new Set( [] ),
		errors: new Set( [] ),
	},
	depth = 0,
) => {
	if( !siteUrl ) {
		throw new Error( 'Site url must be defined' );
	}

	// For each url fetch the page data
	const getLinks = [ ...pages.queue ].map( async ( url ) => {
		// Delete the URL from queue
		pages.queue.delete( url );

		try {
			const { headers } = await Got.head( url );
			if( headers[ 'content-type' ].includes( 'text/html' ) ) {
				const { body } = await Got( url );

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
	return GetSiteUrls( siteUrl, maxDepth, pages, depth + 1 );
};


// Export the default module
module.exports = GetSiteUrls;

// Export the functions for testing
module.exports.CleanUrl = CleanUrl;
module.exports.GetLinks = GetLinks;
