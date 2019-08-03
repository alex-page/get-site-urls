// Dependencies
const test = require('ava');
const express = require('express');

// Local dependencies
const getSiteUrls = require('.');
const {cleanUrl, getLinks} = require('.');

// Integration test for a website
test('Intergration test, mock website', async t => {
	const App = express();
	const Server = App.listen('3000');

	// Use the tests mock folder
	App.use(express.static('./tests/fixture/'));

	// Get the URLs from the mock website
	const urls = await getSiteUrls('http://localhost:3000');

	const errors = [
		'http://localhost:3000/child-b/img.jpeg',
		'http://localhost:3000/child-b/img.iojiajsdja',
		'http://localhost:3000/child-b/img.png',
		'http://localhost:3000/child-a/child-b',
		'http://localhost:3000/child-does-not-exist'
	];

	const pages = [
		'http://localhost:3000',
		'http://localhost:3000/child-a',
		'http://localhost:3000/child-b',
		'http://localhost:3000/child-c'
	];

	// Compare the results
	t.true(urls.errors.every(x => errors.includes(x)));
	t.true(urls.pages.every(x => pages.includes(x)));

	// Close the express server
	await Server.close();
});

// A test for the clean URL function
test('Clean URL test', t => {
	t.is(cleanUrl('https://alexpage.com.au/'), 'https://alexpage.com.au');
	t.is(cleanUrl('https://alexpage.com.au'), 'https://alexpage.com.au');
	t.is(cleanUrl('alexpage.com.au/'), 'http://alexpage.com.au');
	t.is(cleanUrl('alexpage.com.au'), 'http://alexpage.com.au');
	t.is(cleanUrl('https://alexpage.com.au/#abc'), 'https://alexpage.com.au');
	t.is(cleanUrl('https://alexpage.com.au/withslash/'), 'https://alexpage.com.au/withslash');
	t.is(cleanUrl('https://alexpage.com.au/home/../about'), 'https://alexpage.com.au/about');
	t.is(cleanUrl('https://alexpage.com.au/?a=abc?b=123'), 'https://alexpage.com.au');
	t.is(cleanUrl('asiodjoais'), 'http://asiodjoais');
	t.is(cleanUrl('https://ds:ds@designsystem.apps.y.cld.gov.au/'), 'https://designsystem.apps.y.cld.gov.au');
});

// A test for the regex search on the HTML
test('Get links', t => {
	const data = `
		<link rel="stylesheet" href="style.css">
		<link rel="stylesheet" href="/style.css">
		<link rel="stylesheet" href="http://localhost:3000/style.css">
		<p>Link</p>
		<p href="failed-link">Link</p>
		<a>Link</a>
		<a href="#">Link</a>
		<a href="/child-b?a=s121&b=0120912">Link</a>
		<a href="/child-c?a=s121&b=0120912">Link</a>
		<a href="child-b#1234">Link</a>
		<a href="child-b">Link</a>
		<a href="/child-b">Link</a>
		<a href="/child-a">Link</a>
		<a href="/child-d/">Link</a>
		<a href="http://localhost:3000/child-e/">Link</a>
		<script src="/here.js"></script>`;

	const links = [
		'http://localhost:3000',
		'http://localhost:3000/child-b',
		'http://localhost:3000/child-c',
		'http://localhost:3000/child-b',
		'http://localhost:3000/child-b',
		'http://localhost:3000/child-b',
		'http://localhost:3000/child-a',
		'http://localhost:3000/child-d',
		'http://localhost:3000/child-e'
	];

	const foundLinks = getLinks(data, 'http://localhost:3000', 'http://localhost:3000');

	t.true(foundLinks.every(x => links.includes(x)));
});
