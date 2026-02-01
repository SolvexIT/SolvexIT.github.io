// --- INSTRUCTION RENDERER ---
// Handles parsing Markdown and rendering the instruction view content.

window.renderInstructionContent = function(data, targetElementId) {
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) return;

    const contentHtml = parseMarkdown(data.content);
    
    let headerHtml = '';
    if (data.info) {
            headerHtml = `<div class="instruction-header" style="margin-bottom:20px; border-bottom:1px solid #333; padding-bottom:10px;">
            <h1 style="color:#58A6FF;">${data.info.title}</h1>
            <div class="meta-info" style="color:#888; font-size:0.9em; margin-top:5px;">
                <span style="margin-right:15px;"><i class="fas fa-user"></i> ${data.info.author}</span>
                <span style="margin-right:15px;"><i class="fas fa-code-branch"></i> v${data.info.version}</span>
                <span><i class="far fa-calendar-alt"></i> ${data.info.last_updated}</span>
            </div>
            </div>`;
    }

    targetElement.innerHTML = headerHtml + contentHtml;
};

// Simple Markdown Parser
function parseMarkdown(lines) {
    if (!Array.isArray(lines)) return '';
    let html = '';
    let inCodeBlock = false;

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
            html += inCodeBlock ? '<pre><code>' : '</code></pre>';
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
        if (processedLine.startsWith('### ')) processedLine = `<h3>${processedLine.substring(4)}</h3>`;
        else if (processedLine.startsWith('## ')) processedLine = `<h2>${processedLine.substring(3)}</h2>`;
        else if (processedLine.startsWith('# ')) processedLine = `<h1>${processedLine.substring(2)}</h1>`;
        
        // Bold
        processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Quotes
        if (processedLine.startsWith('&gt; ')) processedLine = `<blockquote>${processedLine.substring(5)}</blockquote>`;

        // Buttons: button{`type`_`label`_`url`}
        processedLine = processedLine.replace(/button\{`(.*?)`_`(.*?)`_`(.*?)`\}/g, (match, type, label, url) => {
            const iconClass = iconMap[label.toLowerCase()] || 'fas fa-link';
            const bgColor = typeColorMap[type.toLowerCase()] || typeColorMap['default'];
            
            // Re-decode URL if it was escaped (though usually it's fine)
            const cleanUrl = url.replace(/&amp;/g, '&');

            return `<a href="${cleanUrl}" target="_blank" class="download-btn" style="display:inline-block; padding:10px 20px; background:${bgColor}; color:white; text-decoration:none; border-radius:6px; margin-right:10px; margin-bottom:10px; font-family: sans-serif; font-weight: bold; font-size: 14px;"><i class="${iconClass}"></i> ${label}</a>`;
        });

        // Paragraphs
        if (line.trim() === '') {
            html += '<br>';
        } else if (!processedLine.startsWith('<')) {
            html += `<p>${processedLine}</p>`;
        } else {
            html += processedLine;
        }
    });
    return html;
}
