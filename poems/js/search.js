// 搜索：Flexsearch 全文搜索 + 表达式字段筛选
// 表达式语法：field:"value" 或 field:value，field 可为 author / dynasty / title

const EXPR_FIELDS = ['author', 'dynasty', 'title'];

// 建立 Flexsearch 索引：标题、作者、朝代、内容（中英文）拼入一条文本
const searchIndex = new FlexSearch.Index({
	tokenize: 'forward',
	context: true
});

POETRY_DATA.forEach(function (poem) {
	const haystack = [
		poem.title, poem.titleEn,
		poem.author, poem.authorEn,
		poem.dynasty, poem.dynastyEn,
		poem.content, poem.contentEn
	].join(' ');
	searchIndex.add(poem.id, haystack);
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

// 执行搜索：全文结果再叠加字段筛选，返回符合全部条件的诗词数组
function searchPoems(input) {
	const parsed = parseExpression(input);
	let list;
	if (parsed.query) {
		const ids = searchIndex.search(parsed.query);
		list = ids.map(function (id) {
			return POETRY_DATA.find(function (p) { return p.id === id; });
		}).filter(Boolean);
	} else {
		list = POETRY_DATA.slice();
	}
	parsed.filters.forEach(function (f) {
		list = list.filter(function (p) { return matchField(p, f.field, f.value); });
	});
	return list;
}
