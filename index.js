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
 * GetLinks - Get all of the URL's from an array of strings
 *
 * @param  {array}  data        - The page body
 * @param  {string} url  - The current URL we are searching
 * @param  {string} searchUrl   - The URL of the website we are searching
 *
 * @return {array}        - An array of links found
 */
const GetLinks = ( data, url, searchUrl ) => {
	const linkPattern = /<a[^>]+href="(.*?)"/g;
	const links = [];
	let result = true;

	// While there is a string to search
	while( result ) {
		// Search the string using the regex pattern
		result = linkPattern.exec( data );

		// Check that the string is finished searching
		if( result === null ) {
			result = false;
			break;
		}

		const link = result[ 1 ];

		if( link.startsWith( searchUrl ) ) {
			links.push( NormalizeUrl( link ) );
		}
		else if(
			!link.startsWith( 'http' ) &&
			!link.startsWith( 'https' ) &&
			!link.endsWith( '.jpg' ) &&
			!link.endsWith( '.png' ) &&
			!link.endsWith( '.svg' ) &&
			!link.endsWith( '.gif' ) &&
			!link.includes( 'mailto:' ) &&
			!link.includes( 'tel:' )
		) {
			if( link.startsWith( '/' ) ) {
				links.push( NormalizeUrl( `${ searchUrl }/${ link }`, {
					removeQueryParameters: [ new RegExp( '.*' ) ],
				}) );
			}
			else {
				links.push( NormalizeUrl( `${ url }/${ link }`, {
					removeQueryParameters: [ new RegExp( '.*' ) ],
				}) );
			}
		}
	}

	// Return the links
	return links;
};


/**
 * FetchData
 *
 * @param {string}  url - the url
 *
 * @return {object}     - the result
 */
const FetchData = async ( url ) => {
	try {
		const { body } = await Got( url );
		return { url, body };
	}
	catch( error ) {
		return {
			url,
			body: false,
		};
	}
};


/**
 * GetSiteUrls - Fetch all of the URL's from a website 🔗
 *
 * @param {string} searchUrl  - The URL we are searching
 * @param {number} maxDepth   - The maximum depth it should crawl
 * @param {object} pages      - The found pages, error pages and next pages in queue
 * @param {number} depth      - The current crawl depth
 *
 * @return {array}            - An array of links found
 */
const GetSiteUrls = (
	searchUrl,
	maxDepth = 100,
	pages = {
		queue: new Set( [ NormalizeUrl( searchUrl ) ] ),
		found: new Set( [] ),
		error: new Set( [] ),
	},
	depth = 0,
) => {
	// For each item in the queue get the data
	const siteDataToResolve = [];
	[ ...pages.queue ].forEach( ( url ) => {
		siteDataToResolve.push( FetchData( url ) );
	});

	return Promise.all( siteDataToResolve )
		.then( ( data ) => {
			data.forEach( ({ url, body }) => {
				pages.queue.delete( url ); // Remove the URL from the queue

				// The page exists
				if( body ) {
					pages.found.add( url ); // Add the URL to found

					// Add the links inside body to the queue
					GetLinks( body, url, searchUrl ).forEach( ( link ) => {
						if( !pages.found.has( link ) && !pages.error.has( link ) ) {
							pages.queue.add( link );
						}
					});
				}
				// There was an error add the url to the error array
				else {
					pages.error.add( url );
				}
			});

			// If we have reached maximum depth or the queue is empty
			// maxDepth + 1 as the first page doesn't count
			if( depth === maxDepth || pages.queue.size === 0 ) {
				return {
					pages: [ ...pages.found ],
					error: [ ...pages.error ],
				};
			}

			return GetSiteUrls( searchUrl, maxDepth, pages, depth + 1 );
		});
};


GetSiteUrls( 'netlify.com' ).then( ({ pages }) => console.log( pages ) );


module.exports = GetSiteUrls;
