// --- INSTRUCTION RENDERER ---
// Handles parsing Markdown and rendering the instruction view content.

window.renderInstructionContent = function(data, targetElementId) {
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) return;

    const contentHtml = parseMarkdown(data.content);
    
    let headerHtml = '';
    if (data.info) {
            headerHtml = `<div class="instruction-header animate-text">
            <h1 class="instruction-title" style="color: #58A6FF;">${data.info.title}</h1>
            <div class="meta-info-container">
                <span class="meta-badge">
                    <i class="fas fa-user meta-icon-user"></i> ${data.info.author}
                </span>
                <span class="meta-badge">
                    <i class="fas fa-code-branch meta-icon-version"></i> v${data.info.version}
                </span>
                <span class="meta-badge">
                    <i class="far fa-calendar-alt meta-icon-date"></i> ${data.info.last_updated}
                </span>
            </div>
            </div>`;
    }

    targetElement.innerHTML = headerHtml + contentHtml;
};

// Global Copy Function
window.copyCode = function(btn) {
    // Find the code block within the same wrapper
    const wrapper = btn.closest('.code-block-wrapper');
    const codeBlock = wrapper.querySelector('code');
    const text = codeBlock.innerText;

    navigator.clipboard.writeText(text).then(() => {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Скопировано';
        btn.classList.add('copied');
        
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        btn.innerHTML = '<i class="fas fa-times"></i> Ошибка';
    });
};

// Simple Markdown Parser
function parseMarkdown(lines) {
    if (!Array.isArray(lines)) return '';
    let html = '';
    let inCodeBlock = false;
    let codeLang = '';

    const iconMap = {
        'download': 'fas fa-download',
        'source_thread': 'fas fa-external-link-alt',
        'telegram': 'fab fa-telegram-plane',
        'plugin': 'fas fa-plug',
        'github': 'fab fa-github'
    };

    const typeColorMap = {
        'default': '#238636',
        'secondary': '#30363d',
        'warning': '#d29922',
        'danger': '#f85149'
    };

    lines.forEach(line => {
        // Code blocks
        if (line.trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            if (inCodeBlock) {
                // Start of block
                codeLang = line.trim().substring(3).trim();
                const langLabel = codeLang ? `<span class="code-lang">${codeLang}</span>` : '';
                html += `<div class="code-block-wrapper animate-text">
                            <div class="code-header">
                                ${langLabel}
                                <button class="copy-code-btn" onclick="copyCode(this)">
                                    <i class="fas fa-copy"></i> Копировать
                                </button>
                            </div>
                            <pre><code>`;
            } else {
                // End of block
                html += '</code></pre></div>';
            }
            return;
        }
        if (inCodeBlock) {
            html += line + '\n';
            return;
        }

        // HTML escaping
        let processedLine = line
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Headers
        if (processedLine.startsWith('### ')) processedLine = `<h3 class="animate-text" style="color: #58A6FF;">${processedLine.substring(4)}</h3>`;
        else if (processedLine.startsWith('## ')) processedLine = `<h2 class="animate-text" style="color: #58A6FF;">${processedLine.substring(3)}</h2>`;
        else if (processedLine.startsWith('# ')) processedLine = `<h1 class="animate-text" style="color: #58A6FF;">${processedLine.substring(2)}</h1>`;
        
        // Bold
        processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Quotes
        if (processedLine.startsWith('&gt; ')) processedLine = `<blockquote class="animate-text">${processedLine.substring(5)}</blockquote>`;

        // Buttons: button{`type`_`label`_`url`}
        processedLine = processedLine.replace(/button\{`(.*?)`_`(.*?)`_`(.*?)`\}/g, (match, type, label, url) => {
            const iconClass = iconMap[label.toLowerCase()] || 'fas fa-link';
            const bgColor = typeColorMap[type.toLowerCase()] || typeColorMap['default'];
            
            // Re-decode URL if it was escaped (though usually it's fine)
            const cleanUrl = url.replace(/&amp;/g, '&');

            return `<a href="${cleanUrl}" target="_blank" class="download-btn animate-text" style="display:inline-block; padding:10px 20px; background:${bgColor}; color:white; text-decoration:none; border-radius:6px; margin-right:10px; margin-bottom:10px; font-family: sans-serif; font-weight: bold; font-size: 14px;"><i class="${iconClass}"></i> ${label}</a>`;
        });

        // Paragraphs
        if (line.trim() === '') {
            html += '<br>';
        } else if (!processedLine.startsWith('<')) {
            html += `<p class="animate-text">${processedLine}</p>`;
        } else {
            html += processedLine;
        }
    });
    return html;
}
