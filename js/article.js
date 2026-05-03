(function() {
    "use strict";

    // ---------- 配置 ----------
    const ARTICLES_JSON_PATH = '../../articles.json';  // 相对于当前文章目录的路径
    const MARKDOWN_FILE = './article.md';              // 正文文件（同目录下）

    // 工具函数：转义 HTML
    function escapeHtml(str) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
        return String(str).replace(/[&<>]/g, c => map[c]);
    }

    // 打字机效果
    function typeWriterEffect() {
        const titleElement = document.getElementById('typingTitle');
        if (!titleElement) return;
        const fullText = "中政集团 · 中政科技";
        let i = 0;
        titleElement.textContent = '';
        function type() {
            if (i < fullText.length) {
                titleElement.textContent += fullText.charAt(i);
                i++;
                setTimeout(type, 100);
            } else {
                titleElement.style.borderRightColor = 'transparent';
            }
        }
        type();
    }

    // 加载本地 meta.json 获取 id
    async function loadLocalMeta() {
        const res = await fetch('./meta.json');
        if (!res.ok) throw new Error(`无法加载 meta.json (HTTP ${res.status})`);
        return await res.json();
    }

    // 加载全局 articles.json
    async function loadGlobalArticles() {
        const res = await fetch(ARTICLES_JSON_PATH);
        if (!res.ok) throw new Error(`无法加载全局文章列表 (HTTP ${res.status})`);
        return await res.json();
    }

    // 根据 id 查找文章
    function findArticleById(articles, id) {
        return articles.find(art => String(art.id) === String(id));
    }

    // 主渲染函数
    async function renderArticle() {
        const container = document.getElementById('articleDetailContent');
        if (!container) return;

        try {
            // 1. 加载 meta.json 获取 id
            const localMeta = await loadLocalMeta();
            const articleId = localMeta.id;
            if (!articleId) throw new Error('meta.json 中未指定 id');

            // 2. 加载全局文章列表
            const articles = await loadGlobalArticles();
            const article = findArticleById(articles, articleId);
            if (!article) throw new Error(`在 articles.json 中未找到 id 为 ${articleId} 的文章`);

            // 更新页面标题
            document.title = `${article.title} | 中政集团`;

            // 3. 替换骨架屏头部为真实数据，正文区域继续显示骨架
            container.innerHTML = `
                <div class="detail-header">
                    <div class="detail-title">${escapeHtml(article.title)}</div>
                    <div class="detail-meta">
                        <span><i class="far fa-user"></i> ${escapeHtml(article.author)}</span>
                        <span><i class="far fa-calendar-alt"></i> ${escapeHtml(article.date)}</span>
                        <span><i class="far fa-folder"></i> ${escapeHtml(article.category)}</span>
                    </div>
                </div>
                <div class="detail-content" id="detailMarkdownBody">
                    <!-- 正文加载期间继续显示骨架线 -->
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>
            `;
            const contentDiv = document.getElementById('detailMarkdownBody');

            // 4. 加载 Markdown 正文
            let markdownText;
            try {
                const mdRes = await fetch(MARKDOWN_FILE);
                if (!mdRes.ok) throw new Error(`HTTP ${mdRes.status}`);
                markdownText = await mdRes.text();
            } catch (mdError) {
                console.error('Markdown 加载失败:', mdError);
                contentDiv.innerHTML = `<div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i> 文章内容加载失败：${escapeHtml(mdError.message)}<br>
                    <small>请确认当前目录下存在 article.md 文件</small>
                </div>`;
                return;
            }

            // 5. 渲染 Markdown 为 HTML
            const rawHtml = marked.parse(markdownText, { async: false });
            contentDiv.innerHTML = rawHtml;

            // 6. 触发 MathJax 重新渲染
            if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
                await MathJax.typesetPromise([contentDiv]);
            }

        } catch (error) {
            console.error('文章渲染失败:', error);
            container.innerHTML = `<div class="error-message">
                <i class="fas fa-exclamation-circle"></i> 加载失败：${escapeHtml(error.message)}
            </div>`;
        }
    }

    // 页面初始化
    window.addEventListener('load', () => {
        typeWriterEffect();
        renderArticle();
    });
})();
