/* 账号层：注册 / 登录 / 登出，全部存 localStorage（按要求不需要考虑安全性，明文即可）。
 *
 * localStorage 的 key 约定：
 *   users          -> JSON 对象 { "用户名": "密码" }
 *   currentUser    -> 当前登录的用户名（空 = 未登录）
 *   a.save:<用户名> -> 之后的每用户存档（to-do #2/#3 使用）
 */

var USERS_KEY = 'users';
var CURRENT_USER_KEY = 'currentUser';

function getUsers() {
	try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); }
	catch (e) { return {}; }
}

function saveUsers(users) {
	localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/* 注册：成功会直接设为已登录并返回 {ok:true}；失败返回 {ok:false, msg} */
function register(name, pass) {
	name = (name || '').trim();
	if (!name || !pass) return { ok: false, msg: '用户名和密码都不能为空' };
	var users = getUsers();
	if (users[name]) return { ok: false, msg: '该用户名已被注册，换一个吧' };
	users[name] = pass;
	saveUsers(users);
	localStorage.setItem(CURRENT_USER_KEY, name);
	return { ok: true };
}

/* 登录：成功设为已登录并返回 {ok:true}；失败返回 {ok:false, msg} */
function login(name, pass) {
	name = (name || '').trim();
	var users = getUsers();
	if (!users[name]) return { ok: false, msg: '用户不存在，请先注册' };
	if (users[name] !== pass) return { ok: false, msg: '密码错误' };
	localStorage.setItem(CURRENT_USER_KEY, name);
	return { ok: true };
}

function logout() {
	localStorage.removeItem(CURRENT_USER_KEY);
}

/* 当前登录用户名；未登录返回 '' */
function currentUser() {
	return localStorage.getItem(CURRENT_USER_KEY) || '';
}
