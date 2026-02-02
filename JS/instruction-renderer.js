// --- INSTRUCTION RENDERER ---
// Handles parsing Markdown and rendering the instruction view content.

window.renderInstructionContent = function(data, targetElementId) {
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) return;

    const contentHtml = parseMarkdown(data.content);
    
    let headerHtml = '';
    if (data.info) {
            headerHtml = `<div class="instruction-header animate-text wait-animation">
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

    // Trigger Streaming Animation
    const animatedElements = targetElement.querySelectorAll('.wait-animation');
    animatedElements.forEach((el, index) => {
        setTimeout(() => {
            el.classList.remove('wait-animation');
        }, index * 200); // Increased delay for a slower, more deliberate streaming effect
    });
};

// Global Copy Function
window.copyCode = function(btn) {
    // Find the code block within the same wrapper
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

    const handleError = (err) => {
        console.error('Failed to copy:', err);
        btn.innerHTML = '<i class="fas fa-times"></i> Ошибка';
        setTimeout(() => {
            btn.innerHTML = originalHtml;
        }, 2000);
    };

    // Fallback method for mobile/older browsers or non-secure contexts
    const fallbackCopy = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        // Ensure textarea is not visible but part of DOM
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.setAttribute('readonly', ''); // Prevent keyboard on mobile
        
        document.body.appendChild(textArea);
        textArea.select();
        textArea.setSelectionRange(0, 99999); // For mobile devices

        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) handleSuccess();
            else handleError('execCommand returned false');
        } catch (err) {
            document.body.removeChild(textArea);
            handleError(err);
        }
    };

    // Try modern API first, then fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(handleSuccess).catch(() => {
            fallbackCopy(text);
        });
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
    let listType = ''; // 'ul' or 'ol'

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

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // 1. LIST HANDLING (UL/OL)
        const isUl = trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ');
        const isOl = /^\d+\.\s/.test(trimmedLine);

        if (isUl || isOl) {
            if (!inList) {
                inList = true;
                listType = isUl ? 'ul' : 'ol';
                html += `<${listType} class="animate-text wait-animation" style="margin-left: 20px; margin-bottom: 10px;">`;
            }
            const content = trimmedLine.substring(isUl ? 2 : trimmedLine.indexOf(' ') + 1);
            const processedContent = processInlineMarkdown(content);
            html += `<li style="margin-bottom: 5px;">${processedContent}</li>`;
            return;
        } else if (inList) {
            html += `</${listType}>`;
            inList = false;
        }

        // 2. CODE BLOCKS
        if (trimmedLine.startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            if (inCodeBlock) {
                codeLang = line.trim().substring(3).trim();
                const langLabel = codeLang ? `<span class="code-lang">${codeLang}</span>` : '';
                html += `<div class="code-block-wrapper animate-text wait-animation">
                            <div class="code-header">
                                ${langLabel}
                                <button class="copy-code-btn" onclick="copyCode(this)">
                                    <i class="fas fa-copy"></i> Копировать
                                </button>
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
            html += '<hr class="animate-text wait-animation" style="border: 0; border-top: 1px solid #333; margin: 20px 0;">';
            return;
        }

        // --- PROCESSING LINE ---
        let processedLine = line
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Headers
        if (processedLine.startsWith('### ')) processedLine = `<h3 class="animate-text wait-animation" style="color: #58A6FF;">${processedLine.substring(4)}</h3>`;
        else if (processedLine.startsWith('## ')) processedLine = `<h2 class="animate-text wait-animation" style="color: #58A6FF;">${processedLine.substring(3)}</h2>`;
        else if (processedLine.startsWith('# ')) processedLine = `<h1 class="animate-text wait-animation" style="color: #58A6FF;">${processedLine.substring(2)}</h1>`;
        
        // Quotes
        if (processedLine.startsWith('&gt; ')) {
            processedLine = `<blockquote class="animate-text wait-animation">${processedLine.substring(5)}</blockquote>`;
        }

        // IMPORTANT: Process Custom Tags BEFORE general inline Markdown to avoid conflicts with underscores
        
        // Flexible Buttons: button{...}
        // Supports both new syntax: button{type<...> label<...> url<...>}
        // And legacy syntax: button{`type`_`label`_`url`}
        processedLine = processedLine.replace(/button\{(.*?)\}/g, (match, content) => {
            let type = 'default';
            let label = 'Link';
            let url = '#';

            // Check for new syntax (contains < or &lt;)
            if ((content.includes('<') || content.includes('&lt;')) && (content.includes('>') || content.includes('&gt;'))) {
                // Type / Color
                const typeMatch = content.match(/(?:type|color)\s*(?:<|&lt;)\s*(.*?)\s*(?:>|&gt;)/i);
                if (typeMatch) type = typeMatch[1].trim();

                // Label / Text
                const labelMatch = content.match(/(?:label|text)\s*(?:<|&lt;)\s*(.*?)\s*(?:>|&gt;)/i);
                if (labelMatch) label = labelMatch[1].trim();

                // URL / Link
                const urlMatch = content.match(/(?:url|link)\s*(?:<|&lt;)\s*(.*?)\s*(?:>|&gt;)/i);
                if (urlMatch) url = urlMatch[1].trim();
            } else {
                // Legacy syntax: `type`_`label`_`url`
                const cleanContent = content.replace(/`/g, '');
                const parts = cleanContent.split('_');
                if (parts.length >= 3) {
                    type = parts[0];
                    label = parts[1];
                    url = parts.slice(2).join('_'); // Rejoin in case url has underscores
                }
            }
            
            const iconClass = iconMap[label.toLowerCase()] || 'fas fa-link';
            const bgColor = typeColorMap[type.toLowerCase()];
            const bgStyle = bgColor ? `background:${bgColor};` : '';
            const cleanUrl = url.replace(/&amp;/g, '&');

            return `<a href="${cleanUrl}" target="_blank" class="download-btn animate-text wait-animation ${type.toLowerCase()}" style="display:inline-block; padding:10px 20px; ${bgStyle} color:white; text-decoration:none; border-radius:6px; margin-right:10px; margin-bottom:10px; font-family: sans-serif; font-weight: bold; font-size: 14px;"><i class="${iconClass}"></i> ${label}</a>`;
        });

        // Custom Images: img{position<center> size<100%> link<url>}
        // Handles arbitrary order and defaults. Supports escaped brackets.
        processedLine = processedLine.replace(/img\{(.*?)\}/g, (match, content) => {
            // Defaults
            let src = '';
            let pos = 'center';
            let size = '100%'; // Default max width

            // Extract params (case insensitive, matches <...> or &lt;...&gt;)
            // Support 'url' or 'link'
            const linkMatch = content.match(/(?:link|url)\s*(?:<|&lt;)\s*(.*?)\s*(?:>|&gt;)/i);
            if (linkMatch) src = linkMatch[1].trim();

            const posMatch = content.match(/position\s*(?:<|&lt;)\s*(.*?)\s*(?:>|&gt;)/i);
            if (posMatch) pos = posMatch[1].toLowerCase().trim();

            const sizeMatch = content.match(/size\s*(?:<|&lt;)\s*(.*?)\s*(?:>|&gt;)/i);
            if (sizeMatch) size = sizeMatch[1].trim();

            // Validation
            if (!src) return ''; // Don't render broken images if link is missing

            // Styles
            let containerStyle = 'margin: 20px 0;';
            if (pos === 'left') containerStyle += 'text-align: left;';
            else if (pos === 'right') containerStyle += 'text-align: right;';
            else containerStyle += 'text-align: center;';

            // Clean URL (HTML escaped ampersands back to normal)
            src = src.replace(/&amp;/g, '&');

            return `<div class="img-container animate-text wait-animation" style="${containerStyle}">
                <img src="${src}" style="width: ${size}; max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);" alt="Instruction Image">
            </div>`;
        });

        // Now apply other inline formatting to the remaining text
        if (!processedLine.startsWith('<')) {
            processedLine = processInlineMarkdown(processedLine);
            if (trimmedLine === '') {
                html += '<br>';
            } else {
                html += `<p class="animate-text wait-animation">${processedLine}</p>`;
            }
        } else {
            // It's already a tag (header, quote, button, img), but we might need inline MD inside it
            // (Only for headers and quotes, as buttons/imgs are self-contained)
            if (processedLine.startsWith('<h') || processedLine.startsWith('<blockquote')) {
                // Find content inside the tag and process it
                processedLine = processedLine.replace(/>(.*?)<\//, (m, inner) => `>${processInlineMarkdown(inner)}</`);
            }
            html += processedLine;
        }
    });
    
    if (inList) html += `</${listType}>`;
    return html;
}

function processInlineMarkdown(text) {
    // 1. Bold: **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 2. Strikethrough: ~~text~~
    text = text.replace(/~~(.*?)~~/g, '<del>$1</del>');
    
    // 3. Italic: *text* (Using only stars to avoid conflict with underscores in buttons)
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 4. Links: [Text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, txt, url) => {
        return `<a href="${url}" target="_blank" style="color: #58A6FF; text-decoration: underline;">${txt}</a>`;
    });

    return text;
}