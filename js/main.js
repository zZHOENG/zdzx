(function() {
    "use strict";

    // ---------- 配置文件路径 ----------
    const CATEGORIES_JSON_URL        = './categories.json';
    const RESOURCES_JSON_URL         = './resources.json';
    const ARTICLES_JSON_URL          = './articles.json';
    const ALL_ARTICLES_CONFIG_URL    = './all_articles_config.json';

    // ---------- 全局状态 ----------
    let articlesData       = [];
    let categoriesData     = [];
    let resourcesData      = [];
    let allArticlesConfig  = [];   // 全部文章允许的分类 id
    let currentCategory    = 'all';

    // ---------- DOM 元素 ----------
    const sidebarEl         = document.getElementById('sidebarNav');
    const blogListContainer = document.getElementById('blogListContainer');
    const resourcesGrid     = document.getElementById('resourcesGrid');
    const typingTitleEl     = document.getElementById('typingTitle');
    const archiveListEl     = document.getElementById('archiveList');

    // ---------- 辅助：转义 HTML ----------
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' })[m]);
    }

    // ---------- 解析日期字符串 (YYYY.MM.DD) 为 Date 对象 ----------
    function parseDate(dateStr) {
        if (!dateStr) return new Date(0); // 无效日期排最后
        const parts = dateStr.split('.');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            return new Date(year, month, day);
        }
        return new Date(0);
    }

    // ---------- 文章排序函数 ----------
    function sortArticles(articles) {
        // 深拷贝避免影响原数组
        const sorted = [...articles];
        // 分离置顶和非置顶
        const topArticles = sorted.filter(a => a.top === true);
        const normalArticles = sorted.filter(a => a.top !== true);

        // 组内排序规则
        const sortByRules = (a, b) => {
            const pidA = (typeof a.pid === 'number' && a.pid > 0) ? a.pid : 0;
            const pidB = (typeof b.pid === 'number' && b.pid > 0) ? b.pid : 0;
            // 优先按是否有 pid 分成两组：有 pid 的在前，无 pid(或0) 的在后
            if (pidA > 0 && pidB === 0) return -1;
            if (pidA === 0 && pidB > 0) return 1;
            // 都有 pid 时按 pid 升序
            if (pidA > 0 && pidB > 0) return pidA - pidB;
            // 都没有 pid，按日期降序（最新在前）
            const dateA = parseDate(a.date);
            const dateB = parseDate(b.date);
            return dateB - dateA;   // 降序
        };

        topArticles.sort(sortByRules);
        normalArticles.sort(sortByRules);

        return topArticles.concat(normalArticles);
    }

    // ---------- 筛选文章（支持全部文章配置）----------
    function filterArticles(category) {
        let filtered;
        if (category === 'all') {
            // 使用全部文章配置（若为空则退回显示所有分类）
            if (allArticlesConfig.length > 0) {
                filtered = articlesData.filter(article => allArticlesConfig.includes(article.category));
            } else {
                filtered = articlesData;
            }
        } else {
            filtered = articlesData.filter(article => article.category === category);
        }
        return sortArticles(filtered);
    }

    // ---------- 渲染侧边栏（完全替换 DOM） ----------
    function renderSidebar() {
        if (!sidebarEl) return;
        // 保留归档容器（在最后），只重建导航部分
        const archiveHTML = document.getElementById('archiveContainer') ? document.getElementById('archiveContainer').outerHTML : '';
        let html = '';
        html += `<div class="nav-item active" data-category="all">
                    <i class="fas fa-newspaper"></i>
                    <span>全部文章</span>
                </div>`;
        categoriesData.forEach(cat => {
            html += `<div class="nav-item" data-category="${escapeHtml(cat.id)}">
                        <i class="${escapeHtml(cat.icon)}"></i>
                        <span>${escapeHtml(cat.label)}</span>
                    </div>`;
        });
        // 把归档容器重新放回
        html += archiveHTML;
        sidebarEl.innerHTML = html;

        // 重新绑定事件（事件委托）
        sidebarEl.addEventListener('click', (e) => {
            const item = e.target.closest('.nav-item');
            if (!item) return;
            const cat = item.getAttribute('data-category');
            if (!cat || cat === currentCategory) return;
            currentCategory = cat;
            // 更新高亮
            sidebarEl.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            // 重新渲染文章列表和归档
            renderBlogList();
            renderArchive();
        });

        // 重新获取归档列表元素引用（因为 innerHTML 已更新）
        window._archiveListEl = document.getElementById('archiveList');
    }

    // ---------- 渲染外部资源卡片 ----------
    function renderResources() {
        if (!resourcesGrid) return;
        resourcesGrid.innerHTML = '';
        resourcesData.forEach(res => {
            const card = document.createElement('a');
            card.className = 'resource-card';
            card.href = res.url;
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
            card.innerHTML = `
                <div class="resource-icon"><i class="${escapeHtml(res.icon)}"></i></div>
                <div class="resource-info">
                    <div class="resource-title">${escapeHtml(res.title)}</div>
                    <div class="resource-desc">${escapeHtml(res.description)}</div>
                </div>
            `;
            resourcesGrid.appendChild(card);
        });
    }

    // ---------- 渲染文章列表（主页卡片） ----------
    function renderBlogList() {
        if (!blogListContainer) return;
        const filtered = filterArticles(currentCategory);

        if (filtered.length === 0) {
            blogListContainer.innerHTML = '<div class="loading-placeholder"><i class="fas fa-search"></i> 该分类下暂无文章。</div>';
            return;
        }

        let html = '';
        filtered.forEach(article => {
            // 徽章处理：置顶和推荐可以并存
            let badgesHtml = '';
            if (article.top) {
                badgesHtml += '<div class="top-badge"><i class="fas fa-thumbtack"></i> 置顶</div>';
            }
            if (typeof article.pid === 'number' && article.pid > 0) {
                badgesHtml += '<div class="recommend-badge"><i class="fas fa-star"></i> 推荐</div>';
            }

            const excerptText = article.excerpt || '点击阅读全文…';
            html += `
                <div class="blog-card" data-url="${escapeHtml(article.url)}">
                    ${badgesHtml}
                    <div class="card-title">${escapeHtml(article.title)}</div>
                    <div class="card-meta">
                        <span><i class="far fa-user"></i> ${escapeHtml(article.author)}</span>
                        <span><i class="far fa-calendar-alt"></i> ${escapeHtml(article.date)}</span>
                        <span><i class="far fa-folder"></i> ${escapeHtml(article.category)}</span>
                    </div>
                    <div class="excerpt">${escapeHtml(excerptText)}</div>
                </div>
            `;
        });
        blogListContainer.innerHTML = html;

        document.querySelectorAll('.blog-card').forEach(card => {
            card.addEventListener('click', () => {
                const url = card.getAttribute('data-url');
                if (url) window.location.href = url;
            });
        });
    }

    // ---------- 渲染归档目录 ----------
    function renderArchive() {
        const listEl = document.getElementById('archiveList');
        if (!listEl) return;

        const filtered = filterArticles(currentCategory);
        if (filtered.length === 0) {
            listEl.innerHTML = '<div class="archive-loading">暂无归档文章</div>';
            return;
        }

        let html = '';
        filtered.forEach(article => {
            html += `
                <a class="archive-item" href="${escapeHtml(article.url)}" title="${escapeHtml(article.title)}">
                    <span class="archive-date">${escapeHtml(article.date)}</span>${escapeHtml(article.title)}
                </a>
            `;
        });
        listEl.innerHTML = html;
    }

    // ---------- 加载 JSON ----------
    async function loadJSON(url) {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status} (${url})`);
        return resp.json();
    }

    // ---------- 加载全部文章配置 ----------
    async function loadAllArticlesConfig() {
        try {
            const data = await loadJSON(ALL_ARTICLES_CONFIG_URL);
            if (Array.isArray(data)) {
                allArticlesConfig = data;
            } else {
                allArticlesConfig = [];
            }
        } catch (e) {
            console.warn('全部文章配置文件加载失败，将显示所有分类文章', e);
            allArticlesConfig = [];   // 默认为空，后续走显示全部逻辑
        }
    }

    // ---------- 初始化所有数据并替换 DOM ----------
    async function loadAllData() {
        blogListContainer.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-pulse"></i> 正在加载文章列表...</div>';
        try {
            // 并行加载基础数据
            const [categories, resources, articles] = await Promise.all([
                loadJSON(CATEGORIES_JSON_URL).catch(() => []),
                loadJSON(RESOURCES_JSON_URL).catch(() => []),
                loadJSON(ARTICLES_JSON_URL).catch(() => [])
            ]);
            categoriesData = Array.isArray(categories) ? categories : [];
            resourcesData  = Array.isArray(resources)  ? resources  : [];
            articlesData   = Array.isArray(articles)   ? articles   : [];

            // 加载全部文章配置（不影响其他渲染）
            await loadAllArticlesConfig();

            // 渲染所有组件
            renderSidebar();
            renderResources();
            renderBlogList();
            renderArchive();      // 初始渲染归档
        } catch (e) {
            console.error('数据加载失败:', e);
            blogListContainer.innerHTML = `<div class="loading-placeholder" style="color:#b91c1c;">
                <i class="fas fa-exclamation-triangle"></i> 数据加载失败，请刷新重试。
            </div>`;
        }
    }

    // ---------- 打字机效果 ----------
    function typeWriterEffect() {
        if (!typingTitleEl) return;
        const fullText = "中政集团 · 中政科技";
        let i = 0;
        typingTitleEl.textContent = '';
        function type() {
            if (i < fullText.length) {
                typingTitleEl.textContent += fullText.charAt(i);
                i++;
                setTimeout(type, 100);
            } else {
                typingTitleEl.style.borderRightColor = 'transparent';
            }
        }
        type();
    }

    // ---------- 页面启动 ----------
    function init() {
        typeWriterEffect();
        loadAllData();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
