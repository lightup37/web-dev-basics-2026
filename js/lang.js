const translations = {
	'zh': {
    title: '网站开发基础',
    desc: '选择项目浏览：',
    btn1: '唐诗宋词',
    btn2: '...',
    footer: '© 2026 · 北京理工大学 · 小组 [组名]'
  },
  'en': {
    title: 'Website Development Basic',
    desc: 'Choose a project:',
    btn1: 'Tang & Song Poems',
    btn2: '...',
    footer: '© 2026 · Beijing Institute of Technology · Group [组名]'
  }
};

const els = {
    title: document.getElementById('title'),
    desc: document.getElementById('desc'),
    btn1: document.getElementById('btn1'),
    btn2: document.getElementById('btn2'),
    footer: document.getElementById('footer-text')
};
const switcher = document.getElementById('lang-switcher');
function setLanguage(lang) {
    const t = translations[lang];
    if (!t) return;
    els.title.textContent = t.title;
    els.desc.textContent = t.desc;
    els.btn1.textContent = t.btn1;
    els.btn2.textContent = t.btn2;
    els.footer.textContent = t.footer;
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    switcher.value = lang;
    localStorage.setItem('preferred-language', lang);
}
switcher.addEventListener('change', function() {
    setLanguage(this.value);
});
const saved = localStorage.getItem('preferred-language') || 'en';
setLanguage(saved);