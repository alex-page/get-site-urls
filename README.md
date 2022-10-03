# 🔗 get-site-urls

> Crawl a URL to generate a sitemap and find 404 errors with one command

## Usage

### Command line interface

```shell
npx get-site-urls polaris.shopify.com
```

#### CLI options

```shell
$ npx get-site-urls --help

Get all of the URL's from a website.

Usage
	$ get-site-urls <url>

Options
	--output=<string>, -o   File saved to the system
	--max-depth=<number>,   Maximum depth of routes to search
	--alias=<string>,       Replace <url> with <alias> for sitemap generation

Examples
	$ get-site-urls polaris.shopify.com --output=sitemap.xml
	✅ Created sitemap.xml with 137 urls
```

### NodeJS

```js
import getSiteUrls from "get-site-urls";

const urls = await getSiteUrls("alexpage.dev");
```

#### NodeJS options

`maxDepth` - Maximum depth of routes to search

```js
import getSiteUrls from "get-site-urls";

const maxDepth = 2;
const urls = await getSiteUrls("alexpage.dev", 2);
```

## Release History

- v3.0.0 - stdout replaced with output file
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
