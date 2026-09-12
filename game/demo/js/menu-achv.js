/* 成就系统（2026-09 从 menu.html 的内联脚本独立出来，已独立成页 achievements.html）
 *
 * 负责：成就墙 #achv-area —— 标题"成就（已达成/总数）"+ 每项的名称/说明/达成标记。
 *       页面预置了 #achv-area 就直接填充它（成就页）；没有预置才自建并插到
 *       "小组介绍 / 退出登录"卡片之前（找不到就追加到 body 末尾）。
 *
 * 依赖：save.js 的 achievementState(user)（成就数据按用户隔离，key: achv:<用户名>）。
 * 对外接口：renderMenuAchievements()  —— 可重复调用（会先清空旧内容再重建）。
 */
(function () {
	'use strict';

	function renderMenuAchievements() {
		var user = (typeof currentUser === 'function') ? currentUser() : null;
		if (!user) return;

		// 优先复用页面预置的挂载点（成就页 achievements.html 的 #achv-area 自带
		// .panel-card 卡片样式），没有预置时才自建，并插到"小组介绍 / 退出登录"卡片之前。
		var holder = document.getElementById('achv-area');
		var preset = !!holder;
		if (preset) {
			holder.innerHTML = '';
		} else {
			holder = document.createElement('div');
			holder.id = 'achv-area';
		}

		var list = (typeof achievementState === 'function') ? achievementState(user) : [];
		var done = list.filter(function (a) { return a.unlocked; }).length;

		var h = document.createElement('h2');
		h.className = 'section-title';
		h.textContent = '成就（' + done + '/' + list.length + '）';
		holder.appendChild(h);

		var ul = document.createElement('ul');
		ul.className = 'level-list';
		list.forEach(function (a) {
			var li = document.createElement('li');
			li.className = 'level-row' + (a.unlocked ? '' : ' achv-locked');
			var info = document.createElement('span');
			info.className = 'level-info';
			info.innerHTML = '<span class="level-name">' + a.name + '</span>' +
				'<span class="level-stars">' + a.desc + '</span>';
			li.appendChild(info);
			var badge = document.createElement('span');
			badge.className = 'level-btn ' + (a.unlocked ? '' : 'level-btn-disabled');
			badge.textContent = a.unlocked ? '✓ 已达成' : '🔒 未解锁';
			li.appendChild(badge);
			ul.appendChild(li);
		});
		holder.appendChild(ul);

		// 自建时才需要找位置插入；预置挂载点已在页面里就位
		if (!preset) {
			var ref = document.querySelector('.menu-list');
			var box = ref ? ref.closest('.page-box') : null;
			if (box && box.parentNode) box.parentNode.insertBefore(holder, box);
			else document.body.appendChild(holder);
		}
	}

	window.renderMenuAchievements = renderMenuAchievements;
})();
