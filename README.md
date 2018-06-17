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
  .then( links => console.log( [ links ] ) );

( async () => {
    try {
        const links = await GetSiteUrls( 'https://alexpage.com.au' );
        console.log( links );
    } catch (error) {
        console.log( error );
        //=> 'Failed to get URLs ...'
    }
})();

// Output would be:
// { 
//   pages: [ 
//     'https://alexpage.com.au',
//     'https://alexpage.com.au/harmonograph',
//     'https://alexpage.com.au/talks/react-government',
//     'https://alexpage.com.au/talks/living-styleguides'
//     ...
//   ], 
//   error: []
// }'
```


## Parameters

The function GetSiteUrls takes four parameters:

```
GetSiteUrls( url, maxDepth );
```

1. url - The url to search
1. maxDepth - The maximum depth to search, default 100


## Release History

* v1.0.1 - 📖 Fixing up documentation
* v1.0.0 - 💥 First commit
