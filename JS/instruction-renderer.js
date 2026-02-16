// --- INSTRUCTION RENDERER ---
// Handles parsing Markdown and rendering the instruction view content.

// Inject styles for anchor buttons
const style = document.createElement('style');
style.textContent = `
    .anchor-btn {
        opacity: 0;
        margin-left: 10px;
        background: none;
        border: none;
        color: #58A6FF;
        cursor: pointer;
        font-size: 0.8em;
        transition: opacity 0.2s, transform 0.2s;
        padding: 5px;
    }
    h1:hover .anchor-btn, h2:hover .anchor-btn, h3:hover .anchor-btn,
    h4:hover .anchor-btn, h5:hover .anchor-btn, h6:hover .anchor-btn {
        opacity: 1;
    }
    .anchor-btn:hover {
        transform: scale(1.2);
        color: #79c0ff;
    }
    .anchor-tooltip {
        position: fixed;
        background: #333;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        z-index: 1000;
        animation: fadeInOut 2s ease forwards;
        border: 1px solid #58A6FF;
    }
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(5px); }
        10% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-5px); }
    }
    /* Improve list item spacing and inline clearance */
    #instructionsContent li {
        line-height: 1.5;
        margin-bottom: 6px;
    }
    #instructionsContent li code, #instructionsContent li mark {
        margin: 0 2px;
        padding: 2px 5px;
        display: inline-block;
        line-height: 1;
        vertical-align: middle;
    }

    /* Image Preview Modal */
    .image-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        backdrop-filter: blur(8px);
        cursor: zoom-out;
    }
    .image-modal.active {
        display: flex;
        opacity: 1;
    }
    .image-modal img {
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        border-radius: 8px;
        transform: scale(0.9) translate(0, 0);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        box-shadow: 0 0 30px rgba(0,0,0,0.5);
        user-select: none;
        -webkit-user-drag: none;
        cursor: grab;
        touch-action: none; /* Важно для мобильных жестов */
    }
    .image-modal img:active {
        cursor: grabbing;
    }
    .image-modal.active img {
        transform: scale(1) translate(0, 0);
    }
    /* Убираем анимацию при активном взаимодействии для плавности */
    .image-modal img.interacting {
        transition: none !important;
    }
    .video-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        backdrop-filter: blur(12px);
    }
    .video-modal.active {
        display: flex;
        opacity: 1;
    }
    .video-modal-content {
        position: relative;
        width: 90%;
        max-width: 1200px;
        max-height: 80vh;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .video-loading-spinner {
        position: absolute;
        display: none;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        color: #58A6FF;
        z-index: 10;
    }
    .video-loading-spinner i {
        font-size: 40px;
        animation: fa-spin 2s linear infinite;
    }
    .video-modal video {
        width: 100%;
        height: auto;
        max-height: 85vh;
        border-radius: 12px;
        box-shadow: 0 0 50px rgba(0,0,0,0.8);
        outline: none;
        background: #000;
    }
    .video-modal video::-webkit-media-controls-fullscreen-button {
        display: none !important;
    }
    .video-container {
        position: relative;
        display: inline-block;
        cursor: pointer;
    }
    .video-overlay-play {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(88, 166, 255, 0.8);
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-size: 24px;
        pointer-events: none;
        transition: all 0.3s ease;
        opacity: 0.8;
        box-shadow: 0 0 15px rgba(0,0,0,0.3);
    }
    .video-container:hover .video-overlay-play {
        transform: translate(-50%, -50%) scale(1.1);
        background: #58A6FF;
        opacity: 1;
    }
    .img-container img {
        transition: transform 0.3s ease, box-shadow 0.3s ease !important;
    }
    .img-container img:hover {
        transform: scale(1.02);
        box-shadow: 0 0 20px rgba(88, 166, 255, 0.4), 0 5px 15px rgba(0,0,0,0.3) !important;
    }
    .video-container video {
        transition: transform 0.3s ease, box-shadow 0.3s ease !important;
    }
    .video-container video:hover {
        transform: scale(1.01);
        box-shadow: 0 0 20px rgba(88, 166, 255, 0.4), 0 5px 15px rgba(0,0,0,0.3) !important;
    }
    .close-modal-btn {
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        font-size: 24px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all 0.2s;
        z-index: 10001;
    }
    .close-modal-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
        color: #ff5f5f;
    }
`;
document.head.appendChild(style);

// --- IMAGE PREVIEW MODAL LOGIC ---
(function initImagePreview() {
    const modal = document.createElement('div');
    modal.id = 'imagePreviewModal';
    modal.className = 'image-modal';
    modal.innerHTML = `
        <button class="close-modal-btn" onclick="window.closeImagePreview()"><i class="fas fa-times"></i></button>
        <img id="previewImage" src="" alt="Preview">
    `;

    const img = modal.querySelector('img');
    let scale = 1, translateX = 0, translateY = 0;
    let isDragging = false, startX, startY;
    let initialDistance = 0;

    const updateTransform = (animate = false) => {
        if (animate) img.classList.remove('interacting');
        else img.classList.add('interacting');
        img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    };

    // Zoom with Wheel
    modal.onwheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(1, scale * delta), 5);
        if (newScale === scale) return;
        
        scale = newScale;
        if (scale === 1) { translateX = 0; translateY = 0; }
        updateTransform();
    };

    // Drag / Pan Logic
    const startPan = (x, y) => {
        if (scale === 1) return;
        isDragging = true;
        startX = x - translateX;
        startY = y - translateY;
        img.classList.add('interacting');
    };

    const doPan = (x, y) => {
        if (!isDragging) return;
        translateX = x - startX;
        translateY = y - startY;
        updateTransform();
    };

    const endPan = () => {
        isDragging = false;
        img.classList.remove('interacting');
    };

    // Mouse Events
    img.onmousedown = (e) => { e.stopPropagation(); startPan(e.clientX, e.clientY); };
    window.addEventListener('mousemove', (e) => doPan(e.clientX, e.clientY));
    window.addEventListener('mouseup', endPan);

    // Touch Events (Mobile)
    img.ontouchstart = (e) => {
        e.stopPropagation();
        if (e.touches.length === 1) {
            startPan(e.touches[0].clientX, e.touches[0].clientY);
        } else if (e.touches.length === 2) {
            initialDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        }
    };

    img.ontouchmove = (e) => {
        if (e.touches.length === 1) {
            doPan(e.touches[0].clientX, e.touches[0].clientY);
        } else if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const delta = dist / initialDistance;
            initialDistance = dist;
            scale = Math.min(Math.max(1, scale * delta), 5);
            if (scale === 1) { translateX = 0; translateY = 0; }
            updateTransform();
        }
    };

    img.ontouchend = endPan;

    // Reset and Close
    window.resetImageZoom = () => {
        scale = 1; translateX = 0; translateY = 0;
        updateTransform(true);
    };

    modal.onclick = (e) => {
        if (e.target.id === 'imagePreviewModal') window.closeImagePreview();
    };
    
    // Add ESC key listener
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.closeImagePreview();
    });

    document.body.appendChild(modal);
})();

window.openImagePreview = function(src) {
    const modal = document.getElementById('imagePreviewModal');
    const img = document.getElementById('previewImage');
    if (window.resetImageZoom) window.resetImageZoom();
    img.src = src;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
};

window.closeImagePreview = function() {
    const modal = document.getElementById('imagePreviewModal');
    if (!modal) return;
    modal.classList.remove('active');
    if (window.resetImageZoom) window.resetImageZoom();
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
    }, 300);
};

// --- VIDEO PREVIEW MODAL LOGIC ---
(function initVideoPreview() {
    const modal = document.createElement('div');
    modal.id = 'videoPreviewModal';
    modal.className = 'video-modal';
    modal.innerHTML = `
        <button class="close-modal-btn" onclick="window.closeVideoPreview()"><i class="fas fa-times"></i></button>
        <div class="video-modal-content">
            <div id="videoSpinner" class="video-loading-spinner">
                <i class="fas fa-circle-notch"></i>
                <span id="videoProgressText">Подключение...</span>
                <div class="video-progress-container">
                    <div id="videoProgressBar" class="video-progress-bar"></div>
                </div>
            </div>
            <video id="previewVideo" controls playsinline controlsList="nofullscreen"></video>
        </div>
    `;

    modal.onclick = (e) => {
        if (e.target.id === 'videoPreviewModal') window.closeVideoPreview();
    };

    document.body.appendChild(modal);
})();

let currentVideoObjectURL = null;

window.openVideoPreview = function(src) {
    const modal = document.getElementById('videoPreviewModal');
    const video = document.getElementById('previewVideo');
    const spinner = document.getElementById('videoSpinner');
    const progressText = document.getElementById('videoProgressText');
    const progressBar = document.getElementById('videoProgressBar');
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';

    // Reset UI
    spinner.style.display = 'flex';
    video.style.opacity = '0';
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = 'Подключение...';

    // Use standard streaming with a "Large Buffer" logic
    video.src = src;
    video.preload = "auto";
    video.load();

    let hasStarted = false;

    // Show spinner if we hit a gap during playback
    video.onwaiting = () => {
        spinner.style.display = 'flex';
        if (progressText) progressText.textContent = 'Дозагрузка...';
    };

    video.onplaying = () => {
        spinner.style.display = 'none';
        video.style.opacity = '1';
    };

    // Tracking progress for the "Large Buffer"
    video.onprogress = () => {
        if (video.duration > 0 && video.buffered.length > 0) {
            let bufferedEnd = 0;
            for (let i = 0; i < video.buffered.length; i++) {
                if (video.buffered.start(i) <= video.currentTime) {
                    bufferedEnd = video.buffered.end(i);
                }
            }
            
            const duration = video.duration;
            const progress = Math.round((bufferedEnd / duration) * 100);
            
            if (progressText) progressText.textContent = `Буфер: ${progress}%`;
            if (progressBar) progressBar.style.width = `${progress}%`;

            // "LARGE BUFFER" LOGIC:
            // Don't start playing until we have 10% buffered OR 20 seconds of video
            if (!hasStarted && (progress >= 10 || bufferedEnd > 20)) {
                hasStarted = true;
                spinner.style.display = 'none';
                video.style.opacity = '1';
                video.play().catch(e => console.log("Auto-play blocked"));
            }
        }
    };

    // Safety fallback
    video.oncanplaythrough = () => {
        if (!hasStarted) {
            hasStarted = true;
            spinner.style.display = 'none';
            video.style.opacity = '1';
            video.play().catch(e => {});
        }
    };

    video.onerror = () => {
        console.error("Video stream error");
        spinner.style.display = 'flex';
        spinner.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>Ошибка стриминга</span>`;
    };
};

window.closeVideoPreview = function() {
    const modal = document.getElementById('videoPreviewModal');
    const video = document.getElementById('previewVideo');
    if (!modal) return;
    
    modal.classList.remove('active');
    if (video) {
        video.pause();
        video.src = ""; 
        video.load();
        video.onwaiting = null;
        video.onplaying = null;
        video.oncanplaythrough = null;
        video.onprogress = null;
        video.onerror = null;
    }

    if (currentVideoObjectURL) {
        URL.revokeObjectURL(currentVideoObjectURL);
        currentVideoObjectURL = null;
    }
    
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }, 300);
};

window.renderInstructionContent = function(data, targetElementId, options = {}) {
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) return;

    let parsedData = data;
    if (typeof data === 'string') {
        try {
            parsedData = JSON.parse(data);
        } catch (e) {
            parsedData = parseCustomFormat(data);
        }
    }

    const contentHtml = parseMarkdown(parsedData.content);
    
    let headerHtml = '';
    if (parsedData.info) {
        const info = parsedData.info;
        headerHtml = `<div class="instruction-header animate-text wait-animation">
            <h1 class="instruction-title" style="color: #58A6FF;">${info.title || ''}</h1>
            <div class="meta-info-container">
                ${info.author ? `
                <span class="meta-badge">
                    <i class="fas fa-user meta-icon-user"></i> ${info.author}
                </span>` : ''}
                ${info.version ? `
                <span class="meta-badge">
                    <i class="fas fa-code-branch meta-icon-version"></i> v${info.version}
                </span>` : ''}
                ${info.last_updated ? `
                <span class="meta-badge">
                    <i class="far fa-calendar-alt meta-icon-date"></i> ${info.last_updated}
                </span>` : ''}
            </div>
            </div>`;
    }

    targetElement.innerHTML = headerHtml + contentHtml;

    // Trigger Streaming Animation or Instant Show
    const animatedElements = targetElement.querySelectorAll('.wait-animation');
    
    if (options.instant) {
        animatedElements.forEach(el => el.classList.remove('wait-animation'));
    } else {
        animatedElements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.remove('wait-animation');
            }, index * 150); // Deliberate streaming effect (Slowed down for better UX)
        });
    }
};

function parseCustomFormat(text) {
    const infoMatch = text.match(/@info<([\s\S]*?)>@info/);
    const contentMatch = text.match(/@content<([\s\S]*?)>@content/);

    const info = {};
    if (infoMatch) {
        const infoBody = infoMatch[1];
        const regex = /([a-z_]+)<(.*?)>/g;
        let match;
        while ((match = regex.exec(infoBody)) !== null) {
            info[match[1]] = match[2];
        }
    }

    let contentLines = [];
    if (contentMatch) {
        // Trim newlines from start/end of the content block
        const rawContent = contentMatch[1].replace(/^\s*[\r\n]/, '').replace(/[\r\n]\s*$/, '');
        contentLines = rawContent.split(/\r?\n/);
    }
    
    return {
        info: info,
        content: contentLines
    };
}

// Global Anchor Copy Function
window.copyAnchorLink = function(slug, btn) {
    const baseUrl = window.location.href.split('#')[0];
    const hash = window.location.hash.split('#');
    // hash[0] is empty, hash[1] is path. Ensure we construct clean URL.
    const path = hash[1] ? hash[1] : '';
    
    const fullUrl = `${baseUrl}#${path}#${slug}`;
    
    // Use fallback if clipboard API fails
    const copyToClipboard = (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return Promise.resolve();
        }
    };

    copyToClipboard(fullUrl).then(() => {
        // Show Tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'anchor-tooltip';
        tooltip.innerHTML = '<i class="fas fa-check"></i> Ссылка скопирована';
        
        const rect = btn.getBoundingClientRect();
        tooltip.style.left = `${rect.left + 20}px`;
        tooltip.style.top = `${rect.top - 10}px`;
        
        document.body.appendChild(tooltip);
        setTimeout(() => tooltip.remove(), 2000);
    });
};

// Global Copy Function for Code Blocks
window.copyCode = function(btn) {
    const wrapper = btn.closest('.code-block-wrapper');
    const codeBlock = wrapper.querySelector('code');
    const text = codeBlock.innerText;
    const originalHtml = btn.innerHTML;

    const handleSuccess = () => {
        btn.innerHTML = '<i class="fas fa-check"></i> Скопировано';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.classList.remove('copied');
        }, 2000);
    };

    const handleError = () => {
        btn.innerHTML = '<i class="fas fa-times"></i> Ошибка';
        setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
    };

    const fallbackCopy = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        try {
            if (document.execCommand('copy')) handleSuccess();
            else handleError();
        } catch (err) { handleError(); }
        document.body.removeChild(textArea);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(handleSuccess).catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
};

// Simple Markdown Parser
function parseMarkdown(lines) {
    if (!Array.isArray(lines)) return '';
    let html = '';
    let inCodeBlock = false;
    let codeLang = '';
    let inList = false;
    let listType = '';
    let lastIndentLevel = 0; // Track indentation to detect nested lists or breaks

    const iconMap = window.iconMap || {};

    const typeColorMap = {
        'default': '#238636',
        'secondary': '#30363d',
        'warning': '#d29922',
        'danger': '#f85149'
    };
    
    const slugify = (text) => text.toLowerCase().trim().replace(/[^\w\u0400-\u04FF\s-]/g, '').replace(/\s+/g, '-');

    // Helper: Pre-process media placeholders
    const preprocessMedia = (text) => {
        const placeholders = [];
        const processedText = text.replace(/(button|img|vid)\{(.*?)\}/g, (match) => {
            placeholders.push(match);
            return `%%PH${placeholders.length - 1}%%`;
        });
        return { text: processedText, placeholders };
    };

    // Helper: Restore media placeholders
    const restoreMedia = (text, placeholders, indentStyle = '') => {
        return text.replace(/%%PH(\d+)%%/g, (match, idx) => {
            const original = placeholders[idx];
            
            if (original.startsWith('button')) {
                return original.replace(/button\{(.*?)\}/g, (m, content) => {
                    let type = 'default', label = 'Link', url = '#';
                    if (content.includes('<') || content.includes('&lt;')) {
                        const tM = content.match(/(?:type|color)\s*(?:<|&lt;)\s*(.*?)\s*(?:>|&gt;)/i);
                        if (tM) type = tM[1].trim();
                        const lM = content.match(/(?:label|text|name)\s*(?:<|&lt;)\s*(.*?)\s*(?:>|&gt;)/i);
                        if (lM) label = lM[1].trim();
                        const uM = content.match(/(?:url|link)\s*(?:<|&lt;)\s*(.*?)\s*(?:>|&gt;)/i);
                        if (uM) url = uM[1].trim();
                    } else {
                        const parts = content.replace(/`/g, '').split('_');
                        if (parts.length >= 3) { 
                            type = parts[0]; 
                            label = parts[1]; 
                            url = parts.slice(2).join('_'); 
                        } else if (parts.length === 2) {
                            // Support label_url syntax (default type)
                            label = parts[0];
                            url = parts[1];
                        }
                    }
                    
                    let processedUrl = url.replace(/&amp;/g, '&');
                    const isExternal = processedUrl.match(/^https?:\/\//i);
                    let targetAttr = 'target="_blank"';
                    
                    if (!isExternal) {
                        targetAttr = '';
                        // Internal Link Logic (match Search Cards)
                        processedUrl = processedUrl.replace(/\.json$/i, '');
                        if (!processedUrl.startsWith('#')) {
                            let cleanPath = processedUrl;
                            if (cleanPath.startsWith('docs/')) {
                                cleanPath = cleanPath.substring(5);
                            }
                            cleanPath = cleanPath.replace(/^\/+/, '');
                            processedUrl = '#/docs/' + cleanPath;
                        }
                    }

                    const bgColor = typeColorMap[type.toLowerCase()];
                    // Use global iconMap. Check label first, then type.
                    const iconClass = (iconMap[label.toLowerCase()] || iconMap[type.toLowerCase()]) || 'fas fa-link';
                    return `<a href="${processedUrl}" ${targetAttr} class="download-btn animate-text wait-animation ${type.toLowerCase()}" style="display:inline-block; padding:10px 20px; ${bgColor ? `background:${bgColor};` : ''} color:white; text-decoration:none; border-radius:6px; margin-right:10px; margin-bottom:10px; font-family: sans-serif; font-weight: bold; font-size: 14px;"><i class="${iconClass}"></i> ${label}</a>`;
                });
            } else if (original.startsWith('img')) {
                return original.replace(/img\{(.*?)\}/g, (m, content) => {
                    let src = '', pos = 'center', size = '100%';
                    const lM = content.match(/(?:link|url)\s*(?:<|&lt;)\s*(.*?)\s*(?:>|&gt;)/i);
                    if (lM) src = lM[1].trim();
                    const pM = content.match(/position\s*(?:<|&lt;)\s*(.*?)\s*(?:>|&gt;)/i);
                    if (pM) pos = pM[1].toLowerCase().trim();
                    const sM = content.match(/size\s*(?:<|&lt;)\s*(.*?)\s*(?:>|&gt;)/i);
                    if (sM) size = sM[1].trim();
                    if (!src) return '';
                    // Apply indentStyle to the image container
                    return `<div class="img-container animate-text wait-animation" style="margin: 20px 0; ${indentStyle} text-align: ${pos === 'left' ? 'left' : (pos === 'right' ? 'right' : 'center')};"><img src="${src.replace(/&amp;/g, '&')}" onclick="window.openImagePreview(this.src)" style="width: ${size}; max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); cursor: zoom-in;" alt="Image"></div>`;
                });
            } else if (original.startsWith('vid')) {
                return original.replace(/vid\{(.*?)\}/g, (m, content) => {
                    let src = '', pos = 'center', size = '100%';
                    const lM = content.match(/(?:link|url)\s*(?:<|&lt;)\s*(.*?)\s*(?:>|&gt;)/i);
                    if (lM) src = lM[1].trim();
                    const pM = content.match(/position\s*(?:<|&lt;)\s*(.*?)\s*(?:>|&gt;)/i);
                    if (pM) pos = pM[1].toLowerCase().trim();
                    const sM = content.match(/size\s*(?:<|&lt;)\s*(.*?)\s*(?:>|&gt;)/i);
                    if (sM) size = sM[1].trim();
                    if (!src) return '';
                    
                    const textAlign = pos === 'left' ? 'left' : (pos === 'right' ? 'right' : 'center');
                    const videoSrc = src.replace(/&amp;/g, '&');
                    
                    return `<div class="video-container-wrapper animate-text wait-animation" style="margin: 20px 0; ${indentStyle} text-align: ${textAlign};">
                        <div class="video-container" onclick="window.openVideoPreview('${videoSrc}')" style="display:inline-block; width: ${size}; max-width: 100%;">
                            <video preload="metadata" playsinline webkit-playsinline style="width: 100%; height: auto; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
                                <source src="${videoSrc}" type="video/mp4">
                            </video>
                            <div class="video-overlay-play">
                                <i class="fas fa-play"></i>
                            </div>
                        </div>
                    </div>`;
                });
            }
            return match;
        });
    };

    lines.forEach((line) => {
        // 0. CALCULATE INDENTATION (Each space counts as a level for margin)
        const leadingWhitespace = line.match(/^[\t ]*/)[0];
        let spaceCount = 0;
        for (const char of leadingWhitespace) {
            if (char === '\t') spaceCount += 4;
            else spaceCount += 1;
        }
        const indentLevel = spaceCount; // Now each space is a level
        const indentPx = indentLevel * 10; // 10px per space/level
        const indentStyle = indentLevel > 0 ? `margin-left: ${indentPx}px;` : '';

        const trimmedLine = line.trim();

        // 0.1 ALIGNMENT BLOCKS
        // Start Block: ::: center/right/left/justify
        const alignMatch = trimmedLine.match(/^:::\s*(center|right|left|justify|start|end)\s*$/i);
        if (alignMatch) {
            if (inList) { html += `</${listType}>\n`; inList = false; }
            const align = alignMatch[1].toLowerCase();
            // Handle logical values if needed, though CSS supports text-align: start/end
            html += `<div class="align-block animate-text wait-animation" style="text-align: ${align}; width: 100%; margin-bottom: 10px;">`;
            return;
        }
        // End Block: :::
        if (trimmedLine === ':::') {
            if (inList) { html += `</${listType}>\n`; inList = false; }
            html += `</div>`;
            return;
        }

        // 1. LISTS
        const ulMatch = trimmedLine.match(/^([-*])\s+(.*)$/) || trimmedLine.match(/^([-*])$/);
        const olMatch = trimmedLine.match(/^(\d+)\.\s+(.*)$/) || trimmedLine.match(/^(\d+)\.$/);
        const isUl = !!ulMatch;
        const isOl = !!olMatch;

        if (isUl || isOl) {
            const newListType = isUl ? 'ul' : 'ol';
            const startNum = olMatch ? olMatch[1] : '1';
            
            if (!inList) {
                inList = true;
                listType = newListType;
                lastIndentLevel = indentLevel;
                const startAttr = (newListType === 'ol' && startNum !== '1') ? ` start="${startNum}"` : '';
                html += `<${listType}${startAttr} class="animate-text wait-animation" style="margin-left: 20px; margin-bottom: 10px; ${indentStyle}">\n`;
            } else if (listType !== newListType || lastIndentLevel !== indentLevel || (isOl && startNum === '1' && trimmedLine.startsWith('1.'))) {
                // Restart list if type/indent changes, OR if it's explicitly "1." which often signals a new list in MD
                html += `</${listType}>\n`;
                listType = newListType;
                lastIndentLevel = indentLevel;
                const startAttr = (newListType === 'ol' && startNum !== '1') ? ` start="${startNum}"` : '';
                html += `<${listType}${startAttr} class="animate-text wait-animation" style="margin-left: 20px; margin-bottom: 10px; ${indentStyle}">\n`;
            }

            const content = (ulMatch ? (ulMatch[2] || '') : (olMatch[2] || ''));
            
            // PROCESS CONTENT: Preprocess media -> Inline MD -> Restore media
            const pre = preprocessMedia(content);
            const mid = processInlineMarkdown(pre.text);
            const final = restoreMedia(mid, pre.placeholders, ''); 
            
            let liIdAttr = '';
            const idMatch = final.match(/\s+\^([a-zA-Z0-9-]+)\s*$/);
            let cleanedFinal = final;
            if (idMatch) {
                liIdAttr = ` id="${idMatch[1]}"`;
                cleanedFinal = final.replace(/\s+\^([a-zA-Z0-9-]+)\s*$/, '');
            }
            
            html += `<li${liIdAttr} style="margin-bottom: 5px;">${cleanedFinal}</li>\n`;
            return;
        } else if (inList && trimmedLine !== '') {
            // If it's a non-empty line and not a list item, check if we should close the list
            // We close it if the indentation is less than or equal to the list's indentation
            if (indentLevel <= lastIndentLevel) {
                html += `</${listType}>\n`;
                inList = false;
            }
        }

        // 2. CODE BLOCKS
        if (trimmedLine.startsWith('```')) {
            if (inList) { html += `</${listType}>\n`; inList = false; }
            inCodeBlock = !inCodeBlock;
            if (inCodeBlock) {
                codeLang = line.trim().substring(3).trim();
                html += `<div class="code-block-wrapper animate-text wait-animation" style="${indentStyle}">
                            <div class="code-header">
                                ${codeLang ? `<span class="code-lang">${codeLang}</span>` : ''}
                                <button class="copy-code-btn" onclick="copyCode(this)"><i class="fas fa-copy"></i> Копировать</button>
                            </div>
                            <pre><code>`;
            } else {
                html += '</code></pre></div>';
            }
            return;
        }
        if (inCodeBlock) {
            html += line + '\n';
            return;
        }

        // 3. HORIZONTAL RULE
        if (trimmedLine === '---' || trimmedLine === '***') {
            if (inList) { html += `</${listType}>\n`; inList = false; }
            html += `<hr class="animate-text wait-animation" style="border: 0; border-top: 1px solid #333; margin: 20px 0; ${indentStyle}">`;
            return;
        }

        // 4. LINE PROCESSING
        let processedLine = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // Headers
        if (processedLine.startsWith('###### ')) {
            const text = processedLine.substring(7);
            const slug = slugify(text);
            processedLine = `<h6 id="${slug}" class="animate-text wait-animation" style="color: #58A6FF; ${indentStyle}">${text}<button class="anchor-btn" onclick="copyAnchorLink('${slug}', this)" title="Копировать ссылку"><i class="fas fa-link"></i></button></h6>`;
        }
        else if (processedLine.startsWith('##### ')) {
            const text = processedLine.substring(6);
            const slug = slugify(text);
            processedLine = `<h5 id="${slug}" class="animate-text wait-animation" style="color: #58A6FF; ${indentStyle}">${text}<button class="anchor-btn" onclick="copyAnchorLink('${slug}', this)" title="Копировать ссылку"><i class="fas fa-link"></i></button></h5>`;
        }
        else if (processedLine.startsWith('#### ')) {
            const text = processedLine.substring(5);
            const slug = slugify(text);
            processedLine = `<h4 id="${slug}" class="animate-text wait-animation" style="color: #58A6FF; ${indentStyle}">${text}<button class="anchor-btn" onclick="copyAnchorLink('${slug}', this)" title="Копировать ссылку"><i class="fas fa-link"></i></button></h4>`;
        }
        else if (processedLine.startsWith('### ')) {
            const text = processedLine.substring(4);
            const slug = slugify(text);
            processedLine = `<h3 id="${slug}" class="animate-text wait-animation" style="color: #58A6FF; ${indentStyle}">${text}<button class="anchor-btn" onclick="copyAnchorLink('${slug}', this)" title="Копировать ссылку"><i class="fas fa-link"></i></button></h3>`;
        }
        else if (processedLine.startsWith('## ')) {
             const text = processedLine.substring(3);
             const slug = slugify(text);
             processedLine = `<h2 id="${slug}" class="animate-text wait-animation" style="color: #58A6FF; ${indentStyle}">${text}<button class="anchor-btn" onclick="copyAnchorLink('${slug}', this)" title="Копировать ссылку"><i class="fas fa-link"></i></button></h2>`;
        }
        else if (processedLine.startsWith('# ')) {
             const text = processedLine.substring(2);
             const slug = slugify(text);
             processedLine = `<h1 id="${slug}" class="animate-text wait-animation" style="color: #58A6FF; ${indentStyle}">${text}<button class="anchor-btn" onclick="copyAnchorLink('${slug}', this)" title="Копировать ссылку"><i class="fas fa-link"></i></button></h1>`;
        }
        
        // Quotes
        if (processedLine.startsWith('&gt; ')) {
            processedLine = `<blockquote class="animate-text wait-animation" style="${indentStyle}">${processedLine.substring(5)}</blockquote>`;
        }

        // TEMPORARY PLACEHOLDERS
        const pre = preprocessMedia(processedLine);
        processedLine = pre.text;

        // Check for Obsidian block ID at the end of the line: ^id123
        let blockId = '';
        const blockIdMatch = processedLine.match(/\s+\^([a-zA-Z0-9-]+)\s*$/);
        if (blockIdMatch) {
            blockId = blockIdMatch[1];
            processedLine = processedLine.replace(/\s+\^([a-zA-Z0-9-]+)\s*$/, '');
        }
        const idAttr = blockId ? ` id="${blockId}"` : '';

        // Process MD inside tags or paragraphs
        if (processedLine.startsWith('<h') || processedLine.startsWith('<blockquote')) {
            // Inject ID into existing tag if present
            if (blockId) {
                processedLine = processedLine.replace(/^<([a-z0-9]+)/i, `<${idAttr}`);
            }
            processedLine = processedLine.replace(/>(.*?)<\//, (m, inner) => `>${processInlineMarkdown(inner)}</`); 
        } else if (!processedLine.startsWith('<')) {
            processedLine = processInlineMarkdown(processedLine);
            // Handle lists specifically in the list block above, but for paragraphs:
            if (!inList) {
                processedLine = (trimmedLine === '') ? '<br>' : `<p${idAttr} class="animate-text wait-animation" style="${indentStyle}">${processedLine}</p>`;
            } else {
                 // If inside a list, we need to inject the ID into the LI that is being built.
                 // The LI is constructed earlier in step 1. We can't easily retroactively add it there without refactoring.
                 // Instead, we wrap the content in a span with the ID.
                 if (blockId) {
                     processedLine = `<span${idAttr}>${processedLine}</span>`;
                 }
            }
        }

        // RESTORE placeholders
        // Pass indentStyle here so it's applied to the media container if it wasn't wrapped in a styled tag
        processedLine = restoreMedia(processedLine, pre.placeholders, indentStyle);

        html += processedLine;
    });
    
    if (inList) html += `</${listType}>\n`;
    return html;
}

function processInlineMarkdown(text) {
    return text
        .replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 4px; color: #ff9f43; font-family: Consolas, monospace; font-size: 0.9em;">$1</code>')
        .replace(/==(.*?)==/g, '<mark style="background: rgba(88, 166, 255, 0.3); color: #fff; padding: 0 4px; border-radius: 4px;">$1</mark>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/~~(.*?)~~/g, '<del>$1</del>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[\[#\^?([^|\]]+)\|?(.*?)\]\]/g, (match, anchor, text) => {
            const label = text || anchor;
            const slug = anchor.toLowerCase().trim().replace(/[^\w\u0400-\u04FF\s-]/g, '').replace(/\s+/g, '-');
            return `<a href="javascript:void(0)" onclick="handleAnchorClick('${slug}')" style="color: #58A6FF; text-decoration: underline; cursor: pointer;">${label}</a>`;
        })
        .replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
            let processedUrl = url;
            const isExternal = processedUrl.startsWith('http');
            
            if (!isExternal) {
                // Internal Link Logic (consistent with buttons)
                processedUrl = processedUrl.replace(/\.json$/i, '');
                if (!processedUrl.startsWith('#')) {
                    let cleanPath = processedUrl;
                    if (cleanPath.startsWith('docs/')) {
                        cleanPath = cleanPath.substring(5);
                    }
                    cleanPath = cleanPath.replace(/^\/+/, '');
                    processedUrl = '#/docs/' + cleanPath;
                }
            }

            // Beautiful numbering for internal links
            if (!isExternal && /^\d+$/.test(text)) {
                 return `<a href="${processedUrl}" class="number-badge" style="
                    display: inline-block;
                    min-width: 20px;
                    padding: 0 6px;
                    border: 1px solid #58A6FF;
                    border-radius: 12px;
                    color: #58A6FF;
                    text-decoration: none;
                    text-align: center;
                    font-size: 0.9em;
                    margin: 0 2px;
                    transition: all 0.2s;
                " onmouseover="this.style.background='#58A6FF'; this.style.color='white'" onmouseout="this.style.background='transparent'; this.style.color='#58A6FF'">${text}</a>`;
            }
            return `<a href="${processedUrl}"${isExternal ? ' target="_blank"' : ''} style="color: #58A6FF; text-decoration: underline;">${text}</a>`;
        });
}

