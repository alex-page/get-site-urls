import got from "got";
import normalizeUrl from "normalize-url";
import { Parser } from "htmlparser2";

export const cleanUrl = (url) =>
	normalizeUrl(url, {
		stripHash: true,
		removeQueryParameters: true,
	});

export const crawlUrl = async ({
	url,
	baseUrl,
	data,
	currentDepth,
	maxDepth,
	spinner,
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

		if (!headers["content-type"].includes("text/html")) {
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
			if (spinner) {
				spinner.text = `${data.found.size} Found, ${data.queue.size} Queued, ${data.errors.size} Errors`;
			}
			const searchSite = [...data.queue].map((url) =>
				crawlUrl({ url, baseUrl, data, currentDepth, maxDepth, spinner })
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

const getSiteUrls = async (siteUrl, maxDepth) => {
	const url = cleanUrl(siteUrl);

	const rawData = {
		queue: new Set([url]),
		found: new Set([]),
		errors: new Set([]),
	};

	await crawlUrl({
		url,
		data: rawData,
		maxDepth,
		spinner: null,
		baseUrl: url,
		currentDepth: 0,
	});

	return {
		found: [...rawData.found].sort(),
		errors: [...rawData.errors].sort(),
	};
};

export default getSiteUrls;
