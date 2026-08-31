// 页面初始化与交互：每日诗词 / 每日诗人 / 随机跳转 / 搜索 / 筛选 / 语言切换

const els = {
	langSwitcher: document.getElementById('lang-switcher'),
	siteTitle: document.getElementById('site-title'),
	searchInput: document.getElementById('search-input'),
	searchBtn: document.getElementById('search-btn'),
	filterDetails: document.getElementById('filter-details'),
	filterSummary: document.getElementById('filter-summary'),
	filterField: document.getElementById('filter-field'),
	filterValue: document.getElementById('filter-value'),
	filterApply: document.getElementById('filter-apply'),
	filterClear: document.getElementById('filter-clear'),
	modules: document.getElementById('modules'),
	results: document.getElementById('results'),
	resultsHeading: document.getElementById('results-heading'),
	resultsCount: document.getElementById('results-count'),
	resultsList: document.getElementById('results-list'),
	dailyPoemTitle: document.getElementById('daily-poem-title'),
	dailyPoemContent: document.getElementById('daily-poem-content'),
	dailyPoemMeta: document.getElementById('daily-poem-meta'),
	dailyPoetTitle: document.getElementById('daily-poet-title'),
	dailyPoetName: document.getElementById('daily-poet-name'),
	dailyPoetWorks: document.getElementById('daily-poet-works'),
	randomBtn: document.getElementById('random-btn'),
	backLink: document.getElementById('back-link'),
	footerText: document.getElementById('footer-text')
};

let currentLang = 'en';

function t(key) {
	const table = translations[currentLang] || translations['en'];
	const value = table[key];
	return value === undefined ? key : value;
}

function isZh() {
	return currentLang === 'zh';
}

// 以日期为种子（一年中的第几天）
function daySeed() {
	const now = new Date();
	const start = new Date(now.getFullYear(), 0, 0);
	return Math.floor((now - start) / 86400000);
}

function renderDailyPoem() {
	const poem = POETRY_DATA[daySeed() % POETRY_DATA.length];
	els.dailyPoemContent.textContent = isZh() ? poem.content : poem.contentEn;
	els.dailyPoemMeta.textContent = (isZh() ? poem.author : poem.authorEn) + ' · ' + (isZh() ? poem.title : poem.titleEn);
}

function renderDailyPoet() {
	const poets = [];
	POETRY_DATA.forEach(function (p) {
		const name = isZh() ? p.author : p.authorEn;
		let poet = poets.find(function (x) { return x.name === name; });
		if (!poet) {
			poet = { name: name, works: [] };
			poets.push(poet);
		}
		poet.works.push(isZh() ? p.title : p.titleEn);
	});
	const poet = poets[daySeed() % poets.length];
	els.dailyPoetName.textContent = poet.name;
	els.dailyPoetWorks.textContent = poet.works.join(' / ');
}

function renderFilterFieldOptions() {
	const fields = [
		{ value: 'author', label: t('filterFieldAuthor') },
		{ value: 'dynasty', label: t('filterFieldDynasty') },
		{ value: 'title', label: t('filterFieldTitle') }
	];
	els.filterField.innerHTML = '';
	fields.forEach(function (f) {
		const opt = document.createElement('option');
		opt.value = f.value;
		opt.textContent = f.label;
		els.filterField.appendChild(opt);
	});
}

function buildFilterValueOptions() {
	const field = els.filterField.value;
	const seen = [];
	POETRY_DATA.forEach(function (p) {
		const value = isZh()
			? (field === 'author' ? p.author : field === 'dynasty' ? p.dynasty : p.title)
			: (field === 'author' ? p.authorEn : field === 'dynasty' ? p.dynastyEn : p.titleEn);
		if (!seen.includes(value)) seen.push(value);
	});
	els.filterValue.innerHTML = '';
	const placeholder = document.createElement('option');
	placeholder.value = '';
	placeholder.textContent = t('filterValuePlaceholder');
	els.filterValue.appendChild(placeholder);
	seen.forEach(function (v) {
		const opt = document.createElement('option');
		opt.value = v;
		opt.textContent = v;
		els.filterValue.appendChild(opt);
	});
}

function buildResultCard(poem) {
	const article = document.createElement('article');
	const header = document.createElement('header');
	const h3 = document.createElement('h3');
	h3.style.margin = '0';
	h3.textContent = isZh() ? poem.title : poem.titleEn;
	header.appendChild(h3);
	const meta = document.createElement('p');
	meta.className = 'muted';
	meta.textContent = (isZh() ? poem.author : poem.authorEn) + ' · ' + (isZh() ? poem.dynasty : poem.dynastyEn);
	const content = document.createElement('p');
	content.className = 'poem-content';
	content.textContent = isZh() ? poem.content : poem.contentEn;
	article.appendChild(header);
	article.appendChild(meta);
	article.appendChild(content);
	return article;
}

// 搜索后显示结果并隐藏下方三个模块
function showResults(list, headingKey) {
	els.modules.hidden = true;
	els.results.hidden = false;
	els.resultsHeading.textContent = t(headingKey);
	els.resultsList.innerHTML = '';
	if (list.length === 0) {
		els.resultsCount.textContent = t('noResults');
		return;
	}
	els.resultsCount.textContent = t('resultsCount').replace('{count}', String(list.length));
	list.forEach(function (poem) {
		els.resultsList.appendChild(buildResultCard(poem));
	});
}

function hideResults() {
	els.results.hidden = true;
	els.modules.hidden = false;
}

function doSearch() {
	const input = els.searchInput.value;
	if (!input.trim()) {
		hideResults();
		return;
	}
	showResults(searchPoems(input), 'resultsHeading');
}

function showRandomPoem() {
	const poem = POETRY_DATA[Math.floor(Math.random() * POETRY_DATA.length)];
	showResults([poem], 'randomHeading');
}

// 筛选：把生成的表达式同步到搜索框（带引号以支持含空格的值），并执行搜索
function applyFilter() {
	const value = els.filterValue.value;
	if (!value) return;
	const field = els.filterField.value;
	// 先移除该字段已有的表达式
	const re = new RegExp('(^|\\s)' + field + ':"[^"]*"|(^|\\s)' + field + ':[^\\s]+', 'g');
	const cleaned = els.searchInput.value.replace(re, ' ').replace(/\s+/g, ' ').trim();
	const parts = cleaned ? cleaned.split(' ') : [];
	parts.push(field + ':"' + value + '"');
	els.searchInput.value = parts.join(' ');
	els.filterDetails.removeAttribute('open');
	doSearch();
}

function clearFilter() {
	els.searchInput.value = '';
	els.filterValue.value = '';
	els.filterDetails.removeAttribute('open');
	hideResults();
}

function applyStaticTexts() {
	document.title = t('title');
	els.siteTitle.textContent = t('title');
	els.searchInput.placeholder = t('searchPlaceholder');
	els.searchBtn.textContent = t('searchBtn');
	els.filterSummary.textContent = t('filterSummary');
	els.filterApply.textContent = t('filterApply');
	els.filterClear.textContent = t('filterClear');
	els.dailyPoemTitle.textContent = t('dailyPoemTitle');
	els.dailyPoetTitle.textContent = t('dailyPoetTitle');
	els.randomBtn.textContent = t('randomBtn');
	els.backLink.textContent = t('backLink');
	els.footerText.textContent = t('footer');
	renderFilterFieldOptions();
}

function setLanguage(lang) {
	if (!translations[lang]) return;
	currentLang = lang;
	document.documentElement.lang = isZh() ? 'zh-CN' : 'en';
	els.langSwitcher.value = lang;
	localStorage.setItem('preferred-language', lang);
	applyStaticTexts();
	buildFilterValueOptions();
	renderDailyPoem();
	renderDailyPoet();
	if (!els.results.hidden) {
		doSearch();
	}
}

// 事件绑定
els.searchBtn.addEventListener('click', doSearch);
els.searchInput.addEventListener('keydown', function (e) {
	if (e.key === 'Enter') doSearch();
});
els.filterField.addEventListener('change', buildFilterValueOptions);
els.filterApply.addEventListener('click', applyFilter);
els.filterClear.addEventListener('click', clearFilter);
els.randomBtn.addEventListener('click', showRandomPoem);
els.langSwitcher.addEventListener('change', function () {
	setLanguage(this.value);
});

// 初始化：默认英文，读取 localStorage 记住的偏好
const savedLang = localStorage.getItem('preferred-language') || 'en';
setLanguage(savedLang);
