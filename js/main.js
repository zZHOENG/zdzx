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
    let allArticlesConfig  = [];
    let currentCategory    = 'all';

    // ---------- DOM 元素 ----------
    const sidebarEl         = document.getElementById('sidebarNav');
    const blogListContainer = document.getElementById('blogListContainer');
    const resourcesGrid     = document.getElementById('resourcesGrid');
    const typingTitleEl     = document.getElementById('typingTitle');

    // ---------- 辅助：转义 HTML ----------
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' })[m]);
    }

    // ---------- 解析日期字符串 ----------
    function parseDate(dateStr) {
        if (!dateStr) return new Date(0);
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
        const sorted = [...articles];
        const topArticles = sorted.filter(a => a.top === true);
        const normalArticles = sorted.filter(a => a.top !== true);

        const sortByRules = (a, b) => {
            const pidA = (typeof a.pid === 'number' && a.pid > 0) ? a.pid : 0;
            const pidB = (typeof b.pid === 'number' && b.pid > 0) ? b.pid : 0;
            if (pidA > 0 && pidB === 0) return -1;
            if (pidA === 0 && pidB > 0) return 1;
            if (pidA > 0 && pidB > 0) return pidA - pidB;
            const dateA = parseDate(a.date);
            const dateB = parseDate(b.date);
            return dateB - dateA;
        };

        topArticles.sort(sortByRules);
        normalArticles.sort(sortByRules);
        return topArticles.concat(normalArticles);
    }

    // ---------- 筛选文章 ----------
    function filterArticles(category) {
        let filtered;
        if (category === 'all') {
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

    // ---------- 渲染侧边栏 ----------
    function renderSidebar() {
        if (!sidebarEl) return;
        // 保存归档容器 HTML
        const archiveContainer = document.getElementById('archiveContainer');
        const archiveHTML = archiveContainer ? archiveContainer.outerHTML : '';
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
        html += archiveHTML;
        sidebarEl.innerHTML = html;

        // 事件委托
        sidebarEl.addEventListener('click', (e) => {
            const item = e.target.closest('.nav-item');
            if (!item) return;
            const cat = item.getAttribute('data-category');
            if (!cat || cat === currentCategory) return;
            currentCategory = cat;
            sidebarEl.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            renderBlogList();
            renderArchive();
        });
    }

    // ---------- 渲染外部资源 ----------
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

    // ---------- 渲染文章列表 ----------
    function renderBlogList() {
        if (!blogListContainer) return;
        const filtered = filterArticles(currentCategory);

        if (filtered.length === 0) {
            blogListContainer.innerHTML = '<div class="loading-placeholder"><i class="fas fa-search"></i> 该分类下暂无文章。</div>';
            return;
        }

        let html = '';
        filtered.forEach(article => {
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
            // 优先使用 archive_title，若不存在或为空字符串则使用 title
            const archiveTitle = (article.archive_title && article.archive_title.trim() !== '') 
                                 ? article.archive_title 
                                 : article.title;
            html += `
                <a class="archive-item" href="${escapeHtml(article.url)}" title="${escapeHtml(article.title)}">
                    <span class="archive-date">${escapeHtml(article.date)}</span>${escapeHtml(archiveTitle)}
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
            allArticlesConfig = [];
        }
    }

    // ---------- 初始化 ----------
    async function loadAllData() {
        blogListContainer.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-pulse"></i> 正在加载文章列表...</div>';
        try {
            const [categories, resources, articles] = await Promise.all([
                loadJSON(CATEGORIES_JSON_URL).catch(() => []),
                loadJSON(RESOURCES_JSON_URL).catch(() => []),
                loadJSON(ARTICLES_JSON_URL).catch(() => [])
            ]);
            categoriesData = Array.isArray(categories) ? categories : [];
            resourcesData  = Array.isArray(resources)  ? resources  : [];
            articlesData   = Array.isArray(articles)   ? articles   : [];

            await loadAllArticlesConfig();

            renderSidebar();
            renderResources();
            renderBlogList();
            renderArchive();
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
