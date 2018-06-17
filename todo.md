

For each url
- Get the page data
- Get the links in the data
- Compare the found links
	- error: add to error list
	- success: 
		- searched page: Add the searched page to successful urls
		- new link: add to search for links queue
- Run the function again with the newly found links
- If there are no new links stop searching for links