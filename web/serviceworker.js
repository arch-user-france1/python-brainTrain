function checkUrlIsStatic(URL) {
  URL = URL.split("/")
  if (URL.length > 2 && URL[3] === "static") {
    return true
  }
  return false
}
function checkUrlIsInit(URL) {
  URL = URL.split("/")
  if (URL.length === 6 && URL[5] === "init") {
    console.info("faking set initialisation")
    return true
  }
  return false
}

const addResourcesToCache = async (resources) => {
  const cache = await caches.open('v1');
  await cache.addAll(resources);
};
const putInCache = async (request, response) => {
  const offlinecache = await caches.open('v1');
  await offlinecache.put(request, response);
};
const putInOfflineCache = async (request, response) => {
  let requestCheckMethod = request.clone()
  if (requestCheckMethod.method === "GET") {
    const cache = await caches.open('networkoffline');
    await cache.put(request, response);
  };
};

const requestHandler = async ({ request, preloadResponsePromise }) => {

  // First try to get the resource from the cache
  const onlinecache = await caches.open('v1')
  const responseFromCache = await onlinecache.match(request)
  if (responseFromCache) {
	  return responseFromCache;
  }

  // Next try to use the preloaded response, if it's there
  const preloadResponse = await preloadResponsePromise;
  if (preloadResponse) {
	  const requestCheckURL = preloadResponse.clone()
    //console.info('using preload response', preloadResponse);
    if (checkUrlIsStatic(requestCheckURL.url))
    {putInCache(request, preloadResponse.clone())}
    else {putInOfflineCache(request, preloadResponse.clone())}
	  return preloadResponse;
  }

  // Next try to get the resource from the network
  try {
	  const responseFromNetwork = await fetch(request.clone());
	  // response may be used only once
	  // we need to save clone to put one copy in cache
	  // and serve second one
    if (checkUrlIsStatic(request.url))
    {putInCache(request, responseFromNetwork.clone())}
    else {putInOfflineCache(request, responseFromNetwork.clone())}
	  return responseFromNetwork;
  } catch (error) {

    // Assuming the server is offline, try to get it from the cache for resources that are critical and might update
    // trying to find the request in the indexeddb offlinestorage
    const offlinecache = await caches.open('networkoffline')
    const responseFromCache = await offlinecache.match(request)
    if (responseFromCache) {
	    return responseFromCache;
    }


    // return a network error response (important)
    // or, if the request is for set initialisation, return {"exists": "True"}
    if (checkUrlIsInit(request.url)) {
      return new Response(JSON.stringify({exists: "True"}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })}

	  console.warn('Network Error: location could not be reached:\nlocation not found in cache and could not be fetched from the server')
	  return new Response('Network error happened', {
	    status: 408,
	    headers: { 'Content-Type': 'text/plain' },
	  });

  }
};

const enableNavigationPreload = async () => {
  if (self.registration.navigationPreload) {
	  await self.registration.navigationPreload.enable();
  }
};

self.addEventListener('activate', (event) => {
  event.waitUntil(enableNavigationPreload());
});

self.addEventListener('install', (event) => {
  event.waitUntil(
	  addResourcesToCache([
      '/',
      '/index2.html',
      '/index.html',
	    '/settings',
	    '/newset',
      '/set_mainpage.html',
      '/learn.html',
      '/static/jquery-3.6.1.min.js',
      '/favicon.ico',
      '/main_html.html'
	  ])
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
	  requestHandler({
	    request: event.request,
	    preloadResponsePromise: event.preloadResponse,
	  })
  );
});
