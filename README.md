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
  --maxdepth, The maximum nested routes to search

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
  ...
```

## Release History

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
