🔗 Get site URL's
==============

> Get all of the URL's from a website.


## Install

```console
npm install get-site-urls
```


## Usage

```js
GetSiteUrls( 'alexpage.com.au' )
	.then( links => console.table( [ links ] ) );

const links = await GetSiteUrls( 'https://alexpage.com.au' );
```


## Parameters

The function GetSiteUrls takes four parameters:

```
GetSiteUrls( url, maxDepth );
```

1. url - The url to search
1. maxDepth - The maximum depth to search, default 100


## Release History

* v0.0.0 - 💥 First commit
