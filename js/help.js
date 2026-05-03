(function() {
    "use strict";

    // 简单的 HTML 转义
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

    // 加载 meta.json
    async function loadArticleMeta() {
        const response = await fetch('./meta.json');
        if (!response.ok) throw new Error(`无法加载 meta.json (HTTP ${response.status})`);
        return await response.json();
    }

    // 渲染文章内容（阶段式替换骨架屏）
    async function renderArticle() {
        const container = document.getElementById('articleDetailContent');
        if (!container) return;

        try {
            // 1. 加载元数据
            const meta = await loadArticleMeta();
            
            // 更新页面标题
            document.title = `${meta.title} | 中政集团`;

            // 2. 替换头部骨架屏为真实数据，正文区域继续显示骨架
            container.innerHTML = `
                <div class="detail-header">
                    <div class="detail-title">${escapeHtml(meta.title)}</div>
                    <div class="detail-meta">
                        <span><i class="far fa-user"></i> ${escapeHtml(meta.author)}</span>
                        <span><i class="far fa-calendar-alt"></i> ${escapeHtml(meta.date)}</span>
                        <span><i class="far fa-folder"></i> ${escapeHtml(meta.category)}</span>
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

            // 3. 确定 Markdown 文件路径（优先使用 meta.markdown，否则默认 ./article.md）
            let markdownPath = meta.markdown;
            if (!markdownPath) {
                markdownPath = './article.md';
                console.warn('meta.json 未指定 markdown 字段，使用默认路径: ./article.md');
            }

            // 4. 加载 Markdown 正文
            let markdownText;
            try {
                const mdResponse = await fetch(markdownPath);
                if (!mdResponse.ok) throw new Error(`HTTP ${mdResponse.status}`);
                markdownText = await mdResponse.text();
            } catch (mdError) {
                console.error('Markdown 加载失败:', mdError);
                contentDiv.innerHTML = `<div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i> 文章内容加载失败：${escapeHtml(mdError.message)}<br>
                    <small>路径：${escapeHtml(markdownPath)}</small>
                </div>`;
                return;
            }

            // 5. 渲染 Markdown（替换正文骨架）
            const rawHtml = marked.parse(markdownText, { async: false });
            contentDiv.innerHTML = rawHtml;

            // 6. 触发 MathJax 渲染
            if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
                await MathJax.typesetPromise([contentDiv]);
            }

        } catch (error) {
            console.error('文章渲染失败:', error);
            container.innerHTML = `<div class="error-message">
                <i class="fas fa-exclamation-circle"></i> 加载失败：${escapeHtml(error.message)}<br>
                <small>请确保当前目录下存在 meta.json 文件</small>
            </div>`;
        }
    }

    // 页面初始化
    window.addEventListener('load', () => {
        typeWriterEffect();
        renderArticle();
    });
})();
