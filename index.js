/*
 * Get all of the URL's from a website 🔗
 */

// Dependencies
const got = require('got');
const normalizeUrl = require('normalize-url');

/**
 * Clean the URL with normalize-url
 *
 * @param   {string} url - A url to clean up
 *
 * @returns {string}     - A clean url
 */
const cleanUrl = url => normalizeUrl(url, {
	stripHash: true,
	removeQueryParameters: [new RegExp('.*')]
});

/**
 * Get all of the URL's from an array of strings
 *
 * @param  {array}  data        - The pages body
 * @param  {string} pageUrl     - The page we are searching for links
 * @param  {string} siteUrl     - The website we are searching
 *
 * @return {array}              - An array of links found
 */
const getLinks = (data, pageUrl, siteUrl) => {
	// Regex link pattern
	const linkPattern = /(?!.*mailto:)(?!.*tel:).<a[^>]+href="(.*?)"/g;
	const links = [];
	let result = true;

	// While there is a string to search
	while (result) {
		// Search the string using the regex pattern
		result = linkPattern.exec(data);

		// If there is no result then end the search
		if (result === null) {
			result = false;
			break;
		}

		const link = result[1];

		// If the link already starts with the URL
		if (link.startsWith(siteUrl)) {
			links.push(cleanUrl(link));
		} else if (!link.startsWith('http') && !link.startsWith('https')
		) {
			// Otherwise make sure it is relative or absolute
			const pageLink = link.startsWith('/') ? `${siteUrl}${link}` : `${pageUrl}/${link}`;

			links.push(cleanUrl(pageLink));
		}
	}

	// Return the links
	return links;
};

/**
 * Fetch all of the URL's from a website 🔗
 *
 * @param {object} settings          - The settings for the search
 * @param {string} settings.siteUrl  - The URL we are searching
 * @param {number} settings.maxDepth - The maximum depth it should crawl
 * @param {string} settings.auth     - Basic authentication if provided
 * @param {object} pages             - The found pages, error pages and next pages in queue
 * @param {number} depth             - The current crawl depth
 *
 * @return {array}                   - An array of links found
 */
const searchSite = async (settings, pages, depth) => {
	const {
		siteUrl,
		maxDepth,
		auth
	} = settings;

	// For each url fetch the page data
	const links = [...pages.queue].map(async url => {
		// Delete the URL from queue
		pages.queue.delete(url);

		try {
			// Add authentication if it is defined
			const gotOptions = auth ? {auth} : {};

			// Get the page header so we can check the type is text/html
			const {headers} = await got.head(url, gotOptions);

			// If it is a HTML page get the body and search for links
			if (headers['content-type'].includes('text/html')) {
				const {body} = await got(url, gotOptions);

				// Add to found as it is a HTML page
				pages.found.add(url);

				// Add the unique links to the queue
				getLinks(body, url, cleanUrl(siteUrl)).forEach(link => {
					// If the link is not in error or found add to queue
					if (!pages.found.has(link) && !pages.errors.has(link)) {
						pages.queue.add(link);
					}
				});
			}
		} catch (error) {
			pages.errors.add(url);
		}
	});

	await Promise.all(links);

	// If we have reached maximum depth or the queue is empty
	// maxDepth + 1 as the first page doesn't count
	if (depth === maxDepth || pages.queue.size === 0) {
		return {
			pages: [...pages.found],
			errors: [...pages.errors]
		};
	}

	// Start the search again as the queue has more to search
	return searchSite(settings, pages, depth + 1);
};

/**
 * Fetch all of the URL's from a website 🔗
 *
 * @param {string} url    - The URL we are searching
 * @param {number} maxDepth   - The maximum depth it should crawl
 *
 * @return {array}            - An array of links found
 */
const getSiteUrls = (url, maxDepth = 100) => {
	const siteUrl = cleanUrl(url);

	const pages = {
		queue: new Set([url]),
		found: new Set([]),
		errors: new Set([])
	};

	const {username, password} = new URL(siteUrl);

	const settings = {
		siteUrl,
		maxDepth,
		auth: username && password ? `${username}:${password}` : ''
	};

	return searchSite(settings, pages, 0);
};

// Export the default module
module.exports = getSiteUrls;

// Export the functions for testing
module.exports.cleanUrl = cleanUrl;
module.exports.getLinks = getLinks;
