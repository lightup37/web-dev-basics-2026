// 页面初始化与交互：每日诗词 / 每日诗人 / 随机跳转 / 搜索 / 筛选 / 语言切换

const els = {
	langSwitcher: document.getElementById('lang-switcher'),
	siteTitle: document.getElementById('site-title'),
	searchInput: document.getElementById('search-input'),
	searchBtn: document.getElementById('search-btn'),
	filterToggle: document.getElementById('filter-toggle'),
	filterPanel: document.getElementById('filter-panel'),
	filterAuthorLabel: document.getElementById('filter-author-label'),
	filterAuthorInput: document.getElementById('filter-author'),
	filterTitleLabel: document.getElementById('filter-title-label'),
	filterTitleInput: document.getElementById('filter-title'),
	filterDynastyLabel: document.getElementById('filter-dynasty-label'),
	filterDynastyTang: document.getElementById('filter-dynasty-tang'),
	filterDynastySong: document.getElementById('filter-dynasty-song'),
	modules: document.getElementById('modules'),
	dailyGrid: document.getElementById('daily-grid'),
	randomArea: document.getElementById('random-area'),
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
let currentRandomPoem = null;

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

// 显示结果并隐藏每日诗词/诗人；keepRandom 为 true 时保留随机跳转按钮
function showResults(list, headingKey, keepRandom) {
	els.dailyGrid.hidden = true;
	els.randomArea.hidden = !keepRandom;
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
	currentRandomPoem = null;
	els.results.hidden = true;
	els.dailyGrid.hidden = false;
	els.randomArea.hidden = false;
}

function doSearch() {
	const input = els.searchInput.value;
	if (!input.trim()) {
		hideResults();
		return;
	}
	currentRandomPoem = null;
	let list;
	try {
		list = searchPoems(input);
	} catch (err) {
		// 搜索异常时给出反馈，避免页面无任何反应
		list = [];
	}
	showResults(list, 'resultsHeading', false);
}

function showRandomPoem() {
	currentRandomPoem = POETRY_DATA[Math.floor(Math.random() * POETRY_DATA.length)];
	showResults([currentRandomPoem], 'randomHeading', true);
}

// ---------- 筛选：表达式同步到搜索框 ----------

// 移除搜索框中某字段已有的表达式
function removeFieldExpression(field) {
	const re = new RegExp('(^|\\s)' + field + ':"[^"]*"|(^|\\s)' + field + ':[^\\s]+', 'g');
	return els.searchInput.value.replace(re, ' ').replace(/\s+/g, ' ').trim();
}

// 同步筛选表达式到搜索框：value 为空则移除该字段
function syncExpression(field, value) {
	const cleaned = removeFieldExpression(field);
	if (value) {
		const parts = cleaned ? cleaned.split(' ') : [];
		parts.push(field + ':"' + value + '"');
		els.searchInput.value = parts.join(' ');
	} else {
		els.searchInput.value = cleaned;
	}
}

// Dynasty 单选切换：Tang / Song，再次点击取消选中（只同步表达式，由 Search 按钮触发搜索）
function setDynasty(value) {
	els.filterDynastyTang.classList.toggle('selected', value === 'Tang');
	els.filterDynastySong.classList.toggle('selected', value === 'Song');
	syncExpression('dynasty', value);
}

// Filter 按钮：展开/收起下拉面板
function toggleFilterPanel() {
	els.filterPanel.hidden = !els.filterPanel.hidden;
	els.filterToggle.setAttribute('aria-expanded', String(!els.filterPanel.hidden));
}

// ---------- 语言切换 ----------

function applyStaticTexts() {
	document.title = t('title');
	els.siteTitle.textContent = t('title');
	els.searchInput.placeholder = t('searchPlaceholder');
	els.searchBtn.textContent = t('searchBtn');
	els.filterToggle.textContent = t('filterToggle');
	els.filterAuthorLabel.textContent = t('filterFieldAuthor');
	els.filterTitleLabel.textContent = t('filterFieldTitle');
	els.filterDynastyLabel.textContent = t('filterFieldDynasty');
	els.filterAuthorInput.placeholder = t('filterAuthorPlaceholder');
	els.filterTitleInput.placeholder = t('filterTitlePlaceholder');
	els.filterDynastyTang.textContent = t('dynastyTang');
	els.filterDynastySong.textContent = t('dynastySong');
	els.dailyPoemTitle.textContent = t('dailyPoemTitle');
	els.dailyPoetTitle.textContent = t('dailyPoetTitle');
	els.randomBtn.textContent = t('randomBtn');
	els.backLink.textContent = t('backLink');
	els.footerText.textContent = t('footer');
}

function setLanguage(lang) {
	if (!translations[lang]) return;
	currentLang = lang;
	document.documentElement.lang = isZh() ? 'zh-CN' : 'en';
	els.langSwitcher.value = lang;
	localStorage.setItem('preferred-language', lang);
	applyStaticTexts();
	renderDailyPoem();
	renderDailyPoet();
	if (!els.results.hidden) {
		if (currentRandomPoem) {
			// 随机结果：语言切换时保持原诗并保留随机按钮
			showResults([currentRandomPoem], 'randomHeading', true);
		} else {
			doSearch();
		}
	}
}

// 事件绑定
els.searchBtn.addEventListener('click', doSearch);
els.filterToggle.addEventListener('click', toggleFilterPanel);
// 点击面板外部时收起下拉面板
document.addEventListener('click', function (e) {
	if (!els.filterPanel.hidden && !els.filterPanel.contains(e.target) && e.target !== els.filterToggle) {
		els.filterPanel.hidden = true;
		els.filterToggle.setAttribute('aria-expanded', 'false');
	}
});
els.searchInput.addEventListener('keydown', function (e) {
	if (e.key === 'Enter') doSearch();
});
// 筛选输入只同步表达式到搜索框，不自动触发搜索（由 Search 按钮 / 回车触发）
els.filterAuthorInput.addEventListener('input', function () {
	syncExpression('author', this.value.trim());
});
els.filterTitleInput.addEventListener('input', function () {
	syncExpression('title', this.value.trim());
});
els.filterDynastyTang.addEventListener('click', function () {
	setDynasty(this.classList.contains('selected') ? '' : 'Tang');
});
els.filterDynastySong.addEventListener('click', function () {
	setDynasty(this.classList.contains('selected') ? '' : 'Song');
});
els.randomBtn.addEventListener('click', showRandomPoem);
els.langSwitcher.addEventListener('change', function () {
	setLanguage(this.value);
});

// 初始化：默认英文，读取 localStorage 记住的偏好
const savedLang = localStorage.getItem('preferred-language') || 'en';
setLanguage(savedLang);
