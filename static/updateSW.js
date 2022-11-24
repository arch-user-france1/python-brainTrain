const updateServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        '/serviceworker.js',
        {
          scope: '/',
        }
      );
      registration.update()

    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }

  }
  else {
	console.warn("service workers not supported in this browser")
    }
};

updateServiceWorker();
