// 搜索：Fuse.js 严格匹配 + 表达式字段筛选
// 表达式语法：field:"value" 或 field:value，field 可为 author / dynasty / title

const EXPR_FIELDS = ['author', 'dynasty', 'title'];

// Fuse.js 索引：严格匹配 title、内容、作者（中英文）
// threshold: 0 为完全精确匹配（不做编辑距离近似）；
// ignoreLocation 允许任意位置匹配（中文子串包含匹配）
const fuse = new Fuse(POETRY_DATA, {
	keys: [
		{ name: 'title', weight: 1 },
		{ name: 'titleEn', weight: 1 },
		{ name: 'author', weight: 1 },
		{ name: 'authorEn', weight: 1 },
		{ name: 'content', weight: 0.7 },
		{ name: 'contentEn', weight: 0.7 }
	],
	threshold: 0,
	ignoreLocation: true,
	shouldSort: true
});

// 解析输入：提取 field:"value" / field:value 表达式，其余文本作为全文查询词
function parseExpression(input) {
	const filters = [];
	const re = /([a-zA-Z]+):"([^"]*)"|([a-zA-Z]+):([^\s]+)/g;
	const cleaned = input.replace(re, function (full, f1, v1, f2, v2) {
		const field = (f1 || f2).toLowerCase();
		const value = v1 !== undefined ? v1 : v2;
		if (EXPR_FIELDS.includes(field)) {
			filters.push({ field: field, value: value });
			return ' ';
		}
		return full;
	});
	return { filters: filters, query: cleaned.replace(/\s+/g, ' ').trim() };
}

// 字段宽松匹配（中英文均匹配）
function matchField(poem, field, value) {
	const v = value.toLowerCase();
	const map = {
		author: [poem.author, poem.authorEn],
		dynasty: [poem.dynasty, poem.dynastyEn],
		title: [poem.title, poem.titleEn]
	};
	return (map[field] || []).some(function (s) {
		return String(s).toLowerCase().includes(v);
	});
}

// 执行搜索：Fuse 模糊搜索结果再叠加字段筛选，返回符合全部条件的诗词数组
function searchPoems(input) {
	const parsed = parseExpression(input);
	let list;
	if (parsed.query) {
		list = fuse.search(parsed.query).map(function (r) { return r.item; });
	} else {
		list = POETRY_DATA.slice();
	}
	parsed.filters.forEach(function (f) {
		list = list.filter(function (p) { return matchField(p, f.field, f.value); });
	});
	return list;
}
