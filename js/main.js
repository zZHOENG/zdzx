(function() {
    "use strict";

    // ---------- 配置文件路径 ----------
    const CATEGORIES_JSON_URL = './categories.json';
    const RESOURCES_JSON_URL  = './resources.json';
    const ARTICLES_JSON_URL   = './articles.json';

    // ---------- 全局状态 ----------
    let articlesData   = [];
    let categoriesData = [];
    let resourcesData  = [];
    let currentCategory = 'all';

    // ---------- DOM 元素 ----------
    const sidebarEl           = document.getElementById('sidebarNav');
    const blogListContainer   = document.getElementById('blogListContainer');
    const resourcesGrid       = document.getElementById('resourcesGrid');
    const typingTitleEl       = document.getElementById('typingTitle');

    // ---------- 辅助：转义 HTML ----------
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' })[m]);
    }

    // ---------- 渲染侧边栏（完全替换 DOM） ----------
    function renderSidebar() {
        if (!sidebarEl) return;
        let html = '';
        // 第一个 item：全部文章
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
        sidebarEl.innerHTML = html;

        // 绑定点击事件（事件委托）
        sidebarEl.addEventListener('click', (e) => {
            const item = e.target.closest('.nav-item');
            if (!item) return;
            const cat = item.getAttribute('data-category');
            if (!cat || cat === currentCategory) return;
            currentCategory = cat;
            // 更新高亮
            sidebarEl.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            // 重新渲染文章列表
            renderBlogList();
        });
    }

    // ---------- 渲染外部资源卡片（完全替换） ----------
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
        if (!articlesData || articlesData.length === 0) {
            blogListContainer.innerHTML = '<div class="loading-placeholder"><i class="fas fa-inbox"></i> 暂无文章，敬请期待。</div>';
            return;
        }

        let filtered = articlesData.filter(article => {
            if (currentCategory === 'all') return true;
            return article.category === currentCategory;
        });

        filtered.sort((a, b) => (b.top === true ? 1 : 0) - (a.top === true ? 1 : 0));

        if (filtered.length === 0) {
            blogListContainer.innerHTML = '<div class="loading-placeholder"><i class="fas fa-search"></i> 该分类下暂无文章。</div>';
            return;
        }

        let html = '';
        filtered.forEach(article => {
            const topBadge = article.top
                ? '<div class="top-badge"><i class="fas fa-thumbtack"></i> 置顶</div>'
                : '';
            const excerptText = article.excerpt || '点击阅读全文…';
            html += `
                <div class="blog-card" data-url="${escapeHtml(article.url)}">
                    ${topBadge}
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

    // ---------- 加载 JSON ----------
    async function loadJSON(url) {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status} (${url})`);
        return resp.json();
    }

    // ---------- 初始化所有数据并替换 DOM ----------
    async function loadAllData() {
        // 保持文章列表加载中占位符
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

            // 用新数据替换静态占位内容
            renderSidebar();
            renderResources();
            renderBlogList();
        } catch (e) {
            console.error('数据加载失败:', e);
            blogListContainer.innerHTML = `<div class="loading-placeholder" style="color:#b91c1c;">
                <i class="fas fa-exclamation-triangle"></i> 数据加载失败，请刷新重试。
            </div>`;
            // 即使加载失败，侧边栏和资源区域仍保留 HTML 静态占位，无需额外处理
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
