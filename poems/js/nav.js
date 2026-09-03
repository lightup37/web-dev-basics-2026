function getRootPath() {
	var path = window.location.pathname;
	var dirs = path.substring(0, path.lastIndexOf('/')).split('/');
	var depth = dirs.filter(function(dir) { return dir.length > 0; }).length;
	return depth == 0 ? './' : new Array(depth + 1).join('../');
}

function getheader(root) {
	return `
		<a href = "${root}index.html" class="btn btn--primary">主页</a>
		<span> | </span>
		<span class="btn btn--tang">唐代诗人</span>
		<a href = "${root}/tang/Du-Fu.html" class="btn btn--primary">杜甫</a>
		<a href = "${root}/tang/Li-Bai.html" class="btn btn--primary">李白</a>
		<a href = "${root}/tang/Li-Shangyin.html" class="btn btn--primary">李商隐</a>
		<span> | </span>
		<span class="btn btn--song">宋代词人</span>
		<a href = "${root}/song/Li-Qingzhao.html" class="btn btn--primary">李清照</a>
		<a href = "${root}/song/Su-Shi.html" class="btn btn--primary">苏轼</a>
		<a href = "${root}/song/Xin-Qiji.html" class="btn btn--primary">辛弃疾</a>
	` ;
}

document.addEventListener('DOMContentLoaded', function() {
	var root = getRootPath();
	var navContainer = document.getElementById('nav');
	if(navContainer) {
		navContainer.innerHTML = getheader(root);
	}
})