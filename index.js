import got from "got";
import normalizeUrl from "normalize-url";
import { Parser } from "htmlparser2";

/** @type {(url: string) => string} */
export const cleanUrl = (url) =>
	normalizeUrl(url, {
		stripHash: true,
		removeQueryParameters: true,
	});

/**
 * @param {Pick<GetSiteUrlsOptions, 'maxDepth' | 'logger'> & {
 *   url: string;
 *   baseUrl: string;
 *   data: GetSiteUrlsData;
 *   currentDepth: number;
 * }} options
 * @returns {Promise<void>}
 */
export const crawlUrl = async ({
	url,
	baseUrl,
	data,
	currentDepth,
	maxDepth,
	logger,
}) => {
	data.queue.delete(url);

	if (maxDepth === currentDepth) return;

	currentDepth += 1;

	try {
		const { headers, statusCode } = await got.head(url);
		if (statusCode !== 200) {
			console.log(statusCode);
			data.errors.add(url);
			return;
		}

		if (!headers["content-type"]?.includes("text/html")) {
			return;
		}

		data.found.add(url);

		const { body } = await got(url);
		const parser = new Parser({
			onopentag(name, attributes) {
				if (name === "a" && attributes.href) {
					if (
						attributes.href.startsWith("#") ||
						attributes.href.startsWith("mailto:") ||
						attributes.href.startsWith("tel:") ||
						attributes.href.startsWith("http")
					) {
						return;
					}

					const newUrl = attributes.href.startsWith("/")
						? cleanUrl(`${baseUrl}${attributes.href}`)
						: cleanUrl(`${url}/${attributes.href}`);

					if (!data.found.has(newUrl) && !data.errors.has(newUrl)) {
						data.queue.add(newUrl);
					}
				}
			},
		});
		parser.write(body);
		parser.end();

		if (data.queue.size > 0) {
			logger?.({
				queue: data.queue.size,
				found: data.found.size,
				errors: data.errors.size,
			});

			const searchSite = [...data.queue].map((url) =>
				crawlUrl({ url, baseUrl, data, currentDepth, maxDepth, logger })
			);
			await Promise.all(searchSite);
		}
	} catch (error) {
		if (!error.message.includes("404")) {
			console.error(`Failed to load ${url}:\n${error.message}\n\n`);
		} else {
			data.errors.add(url);
		}
	}
};

/**
 * @typedef {object} GetSiteUrlsData
 * @property {Set<string>} queue
 * @property {Set<string>} found
 * @property {Set<string>} errors
 */

/**
 * @typedef {object} GetSiteUrlsResult
 * @property {string[]} found
 * @property {string[]} errors
 */

/**
 * @typedef {object} GetSiteUrlsOptions
 * @property {number} [maxDepth]
 * @property {(current: { queue: number; found: number; errors: number }) => void} [logger]
 */

/**
 * @param {string} siteUrl
 * @param {GetSiteUrlsOptions} [options]
 * @returns {Promise<GetSiteUrlsResult>}
 */
const getSiteUrls = async (siteUrl, { maxDepth, logger } = {}) => {
	const url = cleanUrl(siteUrl);

	/**  @type {GetSiteUrlsData} */
	const rawData = {
		queue: new Set([url]),
		found: new Set([]),
		errors: new Set([]),
	};

	await crawlUrl({
		url,
		data: rawData,
		maxDepth,
		logger,
		baseUrl: url,
		currentDepth: 0,
	});

	return {
		found: [...rawData.found].sort(),
		errors: [...rawData.errors].sort(),
	};
};

export default getSiteUrls;
