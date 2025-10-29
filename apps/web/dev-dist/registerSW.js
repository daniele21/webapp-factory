if ('serviceWorker' in navigator) {
	// The dev service worker is built from a TypeScript module (imports).
	// Register it as a module so browsers evaluate it with module semantics.
	navigator.serviceWorker.register('/dev-sw.js?dev-sw', { scope: '/', type: 'module' }).catch((err) => {
		// eslint-disable-next-line no-console
		console.error('ServiceWorker registration failed:', err)
	})
}