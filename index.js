#!/usr/bin/env node
import fs from "fs";
import meow from "meow";
import got from "got";
import ora from "ora";
import normalizeUrl from "normalize-url";
import { Parser } from "htmlparser2";

const cli = meow(
	`
	Usage
		$ get-site-urls <url>

	Options
		--max-depth=<number>,   Maximum depth of routes to search
		--output=<string>, -o   File saved to the system
		--format=<string>, -f,  File format

	Examples
		$ get-site-urls polaris.shopify.com
		Created data.json [166 urls found, 2 errors]
`,
	{
		importMeta: import.meta,
		flags: {
			maxDepth: {
				default: 100,
			},
			output: {
				default: "data.json",
			},
			format: {
				default: "json",
			},
		},
	}
);

const cleanUrl = (url) =>
	normalizeUrl(url, {
		stripHash: true,
		removeQueryParameters: true,
	});

const crawlUrl = async ({
	url,
	baseUrl,
	data,
	currentDepth,
	maxDepth,
	spinner,
}) => {
	data.queue.delete(url);

	if (maxDepth === currentDepth) {
		return;
	}

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
			spinner.text = `Found ${data.found.size}, Queued ${data.queue.size}, Errors ${data.errors.size}`;
			const searchSite = [...data.queue].map((url) =>
				crawlUrl({ url, baseUrl, data, currentDepth, maxDepth, spinner })
			);
			await Promise.all(searchSite);
		}
	} catch (error) {
		console.error(error.message);
		data.errors.add(url);
	}
};

const [siteUrl] = cli.input;
const { maxDepth, output, format } = cli.flags;
const spinner = ora(`Crawling ${siteUrl}`).start();

if (!siteUrl) {
	throw new Error("No url provided.");
}

if (maxDepth <= 0) {
	throw new Error("Maximum depth must be greater then zero");
}

try {
	const url = cleanUrl(siteUrl);
	const data = {
		queue: new Set([url]),
		found: new Set([]),
		errors: new Set([]),
	};

	await crawlUrl({
		url,
		data,
		maxDepth,
		spinner,
		baseUrl: url,
		currentDepth: 0,
	});

	spinner.stop();

	const formattedData = JSON.stringify(
		{
			found: [...data.found].sort(),
			errors: [...data.errors].sort(),
		},
		null,
		2
	);

	if (format === "json") {
		fs.writeFileSync(output, formattedData);
		console.log(
			`Created ${output} [${data.found.size} urls found, ${data.errors.size} errors]`
		);
	}
} catch (error) {
	spinner.fail(`Failed to get URLS for ${siteUrl}`);
	console.error(error);
}
