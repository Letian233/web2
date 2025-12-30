/**
 * About page random content switching feature
 * Click "Update Content" button to randomly display different content
 */

(function() {
    'use strict';
    document.addEventListener('DOMContentLoaded', function() {
        // Get content data from data attribute
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
        
        // Check if content data exists
        if (!Array.isArray(contents) || contents.length <= 1) {
            console.log('About content: No data or only one item, skipping update button');
            return;
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

        let currentContentIndex = -1;

        /**
         * Randomly select a content item (ensures no duplicate display of the same item)
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
         * Render content at specified index
         */
        function renderContent(index) {
            if (index < 0 || index >= contents.length) {
                console.warn('Invalid index:', index, 'Total:', contents.length);
                return;
            }

            console.log('Rendering content at index:', index);
            const content = contents[index];
            currentContentIndex = index;

            // Update title
            if (titleElement && content.title) {
                titleElement.textContent = content.title;
            }

            let html = '<div class="content-item">';

            if (content.image_url && content.image_url.trim() !== '') {
                let imageSrc = content.image_url;
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
            
            container.innerHTML = html;
        }

        /**
         * HTML escape function to prevent XSS
         */
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /**
         * Update content button click event
         */
        updateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Randomly select a content item
            const randomIndex = getRandomContentIndex();
            renderContent(randomIndex);
        });
    });
})();
