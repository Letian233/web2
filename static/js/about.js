/**
 * About 页面推文随机切换功能
 * 点击"更新推文"按钮随机显示不同的推文
 */

(function() {
    'use strict';

    // 等待 DOM 加载完成
    document.addEventListener('DOMContentLoaded', function() {
        // 从 data 属性获取内容数据
        const wrapper = document.getElementById('aboutContentWrapper');
        if (!wrapper) {
            console.log('About content: Wrapper not found');
            return;
        }
        
        let contents = [];
        try {
            const contentsData = wrapper.getAttribute('data-contents');
            if (contentsData) {
                contents = JSON.parse(contentsData);
            }
        } catch (e) {
            console.error('About content: Failed to parse contents data', e);
            return;
        }
        
        // 检查是否有内容数据
        if (!Array.isArray(contents) || contents.length <= 1) {
            console.log('About content: No data or only one item, skipping update button');
            return; // 如果没有数据或只有一条，不显示更新按钮
        }
        const container = document.getElementById('aboutContentContainer');
        const titleElement = document.getElementById('contentTitle');
        const updateBtn = document.getElementById('updateContentBtn');

        if (!container || !updateBtn) {
            console.error('About content: Missing required elements', {
                container: !!container,
                updateBtn: !!updateBtn
            });
            return;
        }

        console.log('About content: Initialized with', contents.length, 'items');

        let currentContentIndex = -1; // 当前显示的内容索引

        /**
         * 随机选择一篇推文（确保不重复显示同一篇）
         */
        function getRandomContentIndex() {
            if (contents.length === 1) {
                return 0;
            }
            
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * contents.length);
            } while (randomIndex === currentContentIndex && contents.length > 1);
            
            return randomIndex;
        }

        /**
         * 渲染指定索引的内容
         */
        function renderContent(index) {
            if (index < 0 || index >= contents.length) {
                console.warn('Invalid index:', index, 'Total:', contents.length);
                return;
            }

            console.log('Rendering content at index:', index);
            const content = contents[index];
            currentContentIndex = index;

            // 更新标题（如果存在标题元素）
            if (titleElement && content.title) {
                titleElement.textContent = content.title;
            }

            // 构建内容 HTML（不包含标题，因为标题在容器外）
            let html = '<div class="content-item">';

            if (content.image_url && content.image_url.trim() !== '') {
                let imageSrc = content.image_url;
                // 处理相对路径
                if (!imageSrc.startsWith('http') && !imageSrc.startsWith('/')) {
                    imageSrc = '/static/' + imageSrc;
                }
                html += '<div class="img mb-4">';
                html += '<img src="' + escapeHtml(imageSrc) + '" class="img-fluid" alt="' + escapeHtml(content.title || '') + '">';
                html += '</div>';
            }

            if (content.content) {
                html += '<div class="about-content">' + content.content + '</div>';
            }

            html += '</div>';

            // 直接更新内容，不使用动画
            container.innerHTML = html;
        }

        /**
         * HTML 转义函数，防止 XSS
         */
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /**
         * 更新推文按钮点击事件
         */
        updateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 随机选择一篇推文
            const randomIndex = getRandomContentIndex();
            renderContent(randomIndex);
        });
    });
})();
