🔗 Get site URL's   [![Build Status](https://travis-ci.org/alex-page/get-site-urls.svg?branch=master)](https://travis-ci.org/alex-page/get-site-urls)
==============

> Get all of the URL's from a website.


## Install

```console
npm install get-site-urls
```


## Usage

```js
GetSiteUrls( 'https://alexpage.com.au' )
	.then( links => console.log( links ) );

GetSiteUrls( 'https://ds:ds@designsystem.apps.y.cld.gov.au' )
	.then( links => console.log( links ) );

( async () => {
	const links = await GetSiteUrls( 'https://alexpage.com.au' );
	console.log( links );
})();
```


## Parameters

The function GetSiteUrls takes two parameters:

```
GetSiteUrls( url, maxDepth );
```

1. url - The url to search
1. maxDepth - The maximum depth to search, default 100


## Release History

* v1.1.0 - Fixing bugs with urls, adding tests and basic auth support
* v1.0.0 - 💥 First commit
