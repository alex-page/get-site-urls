#!/usr/bin/env node
import meow from 'meow';
import got from 'got';
import ora from 'ora';
import normalizeUrl from 'normalize-url';
import {Parser} from 'htmlparser2';

const cli = meow(
	`
	Usage
		$ get-site-urls <url>

	Options
		--maxdepth, The maximum nested routes to search (default, 100)

	Examples
		$ get-site-urls polaris.shopify.com
		http://polaris.shopify.com
		http://polaris.shopify.com/components
		http://polaris.shopify.com/components/account-connection
		http://polaris.shopify.com/components/action-list
		http://polaris.shopify.com/components/actions/button
		http://polaris.shopify.com/components/actions/button-group
		http://polaris.shopify.com/components/app-provider
		http://polaris.shopify.com/components/autocomplete
`,
	{
		importMeta: import.meta,
		flags: {
			maxdepth: {
				default: 100,
			},
		},
	},
);

const cleanUrl = url =>
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
		const {headers} = await got.head(url);
		if (!headers['content-type'].includes('text/html')) {
			return;
		}

		data.found.add(url);

		const {body} = await got(url);
		const parser = new Parser({
			onopentag(name, attributes) {
				if (name === 'a' && attributes.href) {
					if (
						attributes.href.startsWith('#')
            || attributes.href.startsWith('mailto:')
            || attributes.href.startsWith('tel:')
            || attributes.href.startsWith('http')
					) {
						return;
					}

					const newUrl = attributes.href.startsWith('/')
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
			spinner.text = `Found ${data.found.size}, Queued ${data.queue.size}`;
			const searchSite = [...data.queue].map(url =>
				crawlUrl({url, baseUrl, data, currentDepth, maxDepth, spinner}),
			);
			await Promise.all(searchSite);
		}
	} catch {
		// Console.log(error);
		data.errors.add(url);
	}
};

const [siteUrl] = cli.input;
const maxDepth = cli.flags.maxdepth;
const spinner = ora(`Crawling ${siteUrl}`).start();

try {
	if (!siteUrl) {
		throw new Error('No url provided.');
	}

	if (maxDepth <= 0) {
		throw new Error('Maximum depth must be greater then zero');
	}

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
		2,
	);
	console.log(formattedData);
} catch (error) {
	spinner.fail(`Failed to get URLS for ${siteUrl}`);
	console.error(error);
}
