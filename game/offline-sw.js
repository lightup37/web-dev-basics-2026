/* 首次在线访问后缓存联机会战所需的全部本地资源；不向第三方域名发出请求。 */
const CACHE_NAME = 'napoleon-offline-v1';
const CORE_ASSETS = [
	'./',
	'./index.html',
	'./register.html',
	'./mode.html',
	'./multiplayer.html',
	'./css/style.css',
	'./js/account.js',
	'./js/ui.js',
	'./js/bgm.js',
	'./js/dialog.js',
	'./js/levels.js',
	'./js/multiplayer.js',
	'./favicon.svg',
	'./mus/La-Marseillaise.mp3',
	'./mus/Preussens-Gloria.mp3',
	'./img/europe-map.svg',
	'./img/portraits/napoleon.webp',
	'./img/portraits/adjutant.webp',
	'./img/blue_infantry.webp',
	'./img/blue_cavalry.webp',
	'./img/blue_skirmisher.webp',
	'./img/blue_artillery.webp',
	'./img/blue_grenadier.webp',
	'./img/red_infantry.webp',
	'./img/red_cavalry.webp',
	'./img/red_artillery.webp',
	'./img/red_grenadier.webp'
];

self.addEventListener('install', function (event) {
	event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
		return cache.addAll(CORE_ASSETS);
	}).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (event) {
	event.waitUntil(caches.keys().then(function (names) {
		return Promise.all(names.filter(function (name) {
			return name.indexOf('napoleon-offline-') === 0 && name !== CACHE_NAME;
		}).map(function (name) { return caches.delete(name); }));
	}).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
	if (event.request.method !== 'GET') return;
	var url = new URL(event.request.url);
	if (url.origin !== self.location.origin || url.pathname.indexOf(new URL('./', self.location.href).pathname) !== 0) return;
	event.respondWith(caches.open(CACHE_NAME).then(function (cache) {
		return cache.match(event.request, { ignoreSearch: true }).then(function (cached) {
			if (cached) return cached;
			return fetch(event.request).then(function (response) {
				if (response && response.ok) cache.put(event.request, response.clone());
				return response;
			});
		});
	}));
});
