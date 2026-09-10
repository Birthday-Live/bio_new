/* ============================================================
   友链页脚本（friend.js）
   读取同目录下的 friend.json → 按 num 升序排序 → 渲染卡片
   字段：num(排序) / title(标题) / avatar(头像) / desc(简介) / link(链接)
   可选：host（不写会自动从 link 里解析域名）
   ============================================================ */

(function () {
    'use strict';

    var DATA_FILE = './friend.json';

    var grid     = document.getElementById('friend-grid');
    var skeleton = document.getElementById('friend-skeleton');
    var countEl  = document.getElementById('friend-count');
    var searchEl = document.getElementById('friend-search');

    /** 全部友链（原始顺序缓存，搜索时基于它过滤） */
    var friends = [];

    /* ---------------- 小工具 ---------------- */

    function escapeHTML(str) {
        return String(str == null ? '' : str).replace(/[&<>"']/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    function hostOf(url) {
        try {
            return new URL(url, location.href).hostname.replace(/^www\./, '');
        } catch (e) {
            return '';
        }
    }

    function firstChar(title) {
        var t = String(title || '').trim();
        if (!t) return '#';
        /* 用 Array.from 取首个字符，避免截断 emoji / 生僻字的代理对 */
        return Array.from(t)[0];
    }

    /** num 升序；num 缺失或非数字的排到最后，并保持原始先后顺序 */
    function sortByNum(list) {
        return list
            .map(function (item, index) {
                return { item: item, index: index, n: Number(item && item.num) };
            })
            .sort(function (a, b) {
                var aOk = isFinite(a.n);
                var bOk = isFinite(b.n);
                if (aOk && bOk) return (a.n - b.n) || (a.index - b.index);
                if (aOk) return -1;
                if (bOk) return 1;
                return a.index - b.index;
            })
            .map(function (o) { return o.item; });
    }

    /* ---------------- 渲染 ---------------- */

    function cardHTML(f, index) {
        var url     = f.link || f.url || '#';
        var title   = f.title || f.name || '未命名站点';
        var desc    = f.desc || f.description || '';
        var avatar  = f.avatar || f.icon || f.image || '';
        var host    = f.host || hostOf(url);
        var delay   = Math.min(index, 24) * 40;

        return '' +
            '<a class="friend-card" href="' + escapeHTML(url) + '" target="_blank" rel="noopener noreferrer"' +
                ' title="' + escapeHTML(title) + '" style="animation-delay:' + delay + 'ms">' +
                '<div class="friend-avatar">' +
                    '<span class="friend-avatar-fallback">' + escapeHTML(firstChar(title)) + '</span>' +
                    (avatar
                        ? '<img src="' + escapeHTML(avatar) + '" alt="' + escapeHTML(title) + '" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">'
                        : '') +
                '</div>' +
                '<div class="friend-main">' +
                    '<div class="friend-title">' + escapeHTML(title) + '</div>' +
                    (desc ? '<div class="friend-desc">' + escapeHTML(desc) + '</div>' : '') +
                    (host ? '<div class="friend-host"><span class="material-symbols-outlined">link</span>' + escapeHTML(host) + '</div>' : '') +
                '</div>' +
                '<span class="material-symbols-outlined friend-arrow">arrow_outward</span>' +
            '</a>';
    }

    function noticeHTML(icon, html) {
        return '<div class="friend-notice"><span class="material-symbols-outlined">' + icon + '</span><div>' + html + '</div></div>';
    }

    function paint(list, keyword) {
        if (!list.length) {
            grid.innerHTML = noticeHTML(
                keyword ? 'search_off' : 'group_off',
                keyword ? '没有匹配到 <code>' + escapeHTML(keyword) + '</code> 的友链~' : '还没有添加友链，去 <code>friend.json</code> 里写一条吧~'
            );
            return;
        }
        grid.innerHTML = list.map(cardHTML).join('');
    }

    function updateCount(shown) {
        if (!countEl) return;
        if (!friends.length) {
            countEl.textContent = '';
            return;
        }
        countEl.innerHTML = shown === friends.length
            ? '共 <b>' + friends.length + '</b> 位朋友'
            : '筛选出 <b>' + shown + '</b> / ' + friends.length + ' 位朋友';
    }

    /* ---------------- 搜索过滤 ---------------- */

    function applyFilter() {
        var kw = (searchEl && searchEl.value || '').trim().toLowerCase();

        if (!kw) {
            paint(friends, '');
            updateCount(friends.length);
            return;
        }

        var hit = friends.filter(function (f) {
            var hay = [
                f.title, f.name,
                f.desc, f.description,
                f.host, hostOf(f.link || f.url || '')
            ].join(' ').toLowerCase();
            return hay.indexOf(kw) !== -1;
        });

        paint(hit, kw);
        updateCount(hit.length);
    }

    if (searchEl) {
        searchEl.addEventListener('input', applyFilter);
    }

    /* ---------------- 加载数据 ---------------- */

    /* 骨架屏只在「加载真的慢」时才露面，避免网速快的时候闪一下很难看 */
    var skTimer = null;

    function showSkeleton() {
        skTimer = setTimeout(function () {
            if (skeleton) skeleton.hidden = false;
        }, 250);
    }

    function hideSkeleton() {
        if (skTimer) {
            clearTimeout(skTimer);
            skTimer = null;
        }
        if (skeleton) {
            /* 直接移除，不依赖 hidden，彻底避免残留 */
            if (skeleton.parentNode) skeleton.parentNode.removeChild(skeleton);
            skeleton = null;
        }
    }

    function load() {
        showSkeleton();

        fetch(DATA_FILE, { cache: 'no-cache' })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (data) {
                /* 兼容：[{...}] 或 {"friends":[{...}]} */
                var raw = Array.isArray(data) ? data : (data && (data.friends || data.list)) || [];
                friends = sortByNum(raw.filter(function (f) { return f && typeof f === 'object'; }));

                hideSkeleton();
                applyFilter();
            })
            .catch(function (err) {
                hideSkeleton();
                if (countEl) countEl.textContent = '';
                grid.innerHTML = noticeHTML(
                    'error',
                    '友链数据加载失败（' + escapeHTML(err && err.message || err) + '）<br>' +
                    '如果你是用 <code>file://</code> 直接双击打开的，浏览器会拦截本地 <code>fetch</code>。<br>' +
                    '请用 HTTP 方式访问：<code>python -m http.server</code> 之类的随便起一个服务即可。'
                );
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', load);
    } else {
        load();
    }
})();
