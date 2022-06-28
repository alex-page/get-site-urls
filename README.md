# 🔗 get-site-urls

> Crawl a URL to generate a sitemap and find 404 errors with one command

## Usage

```shell
npx get-site-urls polaris.shopify.com
```

## Usage

```shell
$ npx get-site-urls --help

Get all of the URL's from a website.

Usage
	$ get-site-urls <url>

Options
	--max-depth=<number>,   Maximum depth of routes to search
	--output=<string>, -o   File saved to the system
	--format=<string>, -f,  File format

Examples
	$ get-site-urls polaris.shopify.com
	Created data.json [166 urls found, 2 errors]
```

## Release History

- v3.0.0 - stdout replaced with a json file, status code errors managed
- v2.0.4 - Remove exports, relative bin entry, index.js !# to run in node env
- v2.0.3 - Rename main to exports in package.json
- v2.0.2 - Add name to bin entry in package.json
- v2.0.1 - Add missing bin entry in package.json
- v2.0.0 - Convert get-site-urls to a cli tool
- v1.1.7 - Update dependencies and GitHub actions to yml syntax
- v1.1.6 - Use `xo` and `ava`, update dependencies
- v1.1.5 - Add tests for urls with ending slash, update documentation
- v1.1.4 - Use files instead of `.npmignore`
- v1.1.3 - Replace travis with GitHub actions
- v1.1.2 - Update package.json link
- v1.1.1 - Fix issue with CI
- v1.1.0 - Fixing bugs with urls, adding tests and basic auth support
- v1.0.0 - 💥 First commit
