const translations = {
    'zh': {
        title: '网站开发基础',
        pageTitle: '网站开发基础 · Untitled Group',
        desc: '选择项目浏览：',
        btn1: '拿破仑战争',
        btn2: '唐诗宋词',
        btn3: '中华美食',
        btn4: '电影欣赏',
        footer: '© 2026 · 北京理工大学 · Untitled Group'
    },
    'en': {
        title: 'Website Development Basic',
        pageTitle: 'Website Development Basic · Untitled Group',
        desc: 'Choose a project:',
        btn1: 'Napoleonic Wars',
        btn2: 'Tang & Song Poems',
        btn3: 'Chinese food',
        btn4: 'Movie Reviews',
        footer: '© 2026 · Beijing Institute of Technology · Untitled Group'
    }
};

const els = {
    title: document.getElementById('title'),
    desc: document.getElementById('desc'),
    btn1: document.getElementById('btn1'),
    btn2: document.getElementById('btn2'),
    btn3: document.getElementById('btn3'),
    btn4: document.getElementById('btn4'),
    footer: document.getElementById('footer-text')
};
const switcher = document.getElementById('lang-switcher');
function setLanguage(lang) {
    if (!translations[lang]) lang = 'en';
    const t = translations[lang];
    els.title.textContent = t.title;
    els.desc.textContent = t.desc;
    els.btn1.textContent = t.btn1;
    els.btn2.textContent = t.btn2;
    els.btn3.textContent = t.btn3;
    els.btn4.textContent = t.btn4;
    els.footer.textContent = t.footer;
    document.title = t.pageTitle;
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    switcher.value = lang;
    localStorage.setItem('preferred-language', lang);
}
switcher.addEventListener('change', function () {
    setLanguage(this.value);
});
const saved = localStorage.getItem('preferred-language') || 'en';
setLanguage(saved);