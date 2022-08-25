#!/usr/bin/env node
import meow from "meow";
import ora from "ora";
import fs from "fs";
import { cleanUrl, crawlUrl } from "./index.js";

const cli = meow(
	`
	Usage
		$ get-site-urls <url>

	Options
		--max-depth=<number>,   Maximum depth of routes to search
		--output=<string>, -o   File saved to the system
		--alias=<string>,       Alias for sitemap

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
		},
	}
);

const supportedFormats = ["csv", "json", "xml"];

const [siteUrl] = cli.input;
const { maxDepth, output, alias = "" } = cli.flags;
const spinner = ora({ prefixText: `${siteUrl}` }).start();

if (!siteUrl) {
	throw new Error("No url provided.");
}

if (maxDepth <= 0) {
	throw new Error("Maximum depth must be greater then zero");
}

const format = output.split(".")[1];

if (!supportedFormats.includes(format)) {
	throw new Error(`Output must be file types [${supportedFormats.join(", ")}]`);
}

try {
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
		spinner,
		baseUrl: url,
		currentDepth: 0,
	});

	const data = {
		found: [...rawData.found].sort(),
		errors: [...rawData.errors].sort(),
	};

	spinner.stop();

	if (format === "json") {
		fs.writeFileSync(output, JSON.stringify(data.found, null, 2));
		console.log(`✅ Created ${output} with ${data.found.length} urls`);
	}

	if (format === "csv") {
		fs.writeFileSync(output, data.found.join("\n"));
		console.log(`✅ Created ${output} with ${data.found.length} urls`);
	}

	if (format === "xml") {
		const date = new Date().toISOString();
		const siteMapUrls = data.found
			.map(
				(url) =>
					`<url><loc>${
						alias !== "" ? url.replace(siteUrl, alias) : url
					}</loc><lastmod>${date}</lastmod><changefreq>daily</changefreq><priority>0.7</priority></url>`
			)
			.join("\n");
		const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${siteMapUrls}
</urlset>`;
		fs.writeFileSync(output, sitemap);
		console.log(`✅ Created ${output} with ${data.found.length} urls`);
	}

	if (data.errors.length) {
		console.log(
			`❌ Failed to load these URLs:\n - ${data.errors.join("\n - ")}`
		);
	}
} catch (error) {
	spinner.fail(`Failed to get URLS for ${siteUrl}`);
	console.error(error);
}
