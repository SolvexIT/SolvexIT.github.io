// --- INSTRUCTION RENDERER ---
// Handles parsing Markdown and rendering the instruction view content.

window.renderInstructionContent = function(data, targetElementId) {
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
            headerHtml = `<div class="instruction-header animate-text wait-animation">
            <h1 class="instruction-title" style="color: #58A6FF;">${parsedData.info.title}</h1>
            <div class="meta-info-container">
                <span class="meta-badge">
                    <i class="fas fa-user meta-icon-user"></i> ${parsedData.info.author}
                </span>
                <span class="meta-badge">
                    <i class="fas fa-code-branch meta-icon-version"></i> v${parsedData.info.version}
                </span>
                <span class="meta-badge">
                    <i class="far fa-calendar-alt meta-icon-date"></i> ${parsedData.info.last_updated}
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
        }, index * 200); // Deliberate streaming effect
    });
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

// Global Copy Function
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

    // Helper: Pre-process media placeholders
    const preprocessMedia = (text) => {
        const placeholders = [];
        const processedText = text.replace(/(button|img)\{(.*?)\}/g, (match) => {
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
                        const lM = content.match(/(?:label|text)\s*(?:<|&lt;)\s*(.*?)\s*(?:>|&gt;)/i);
                        if (lM) label = lM[1].trim();
                        const uM = content.match(/(?:url|link)\s*(?:<|&lt;)\s*(.*?)\s*(?:>|&gt;)/i);
                        if (uM) url = uM[1].trim();
                    } else {
                        const parts = content.replace(/`/g, '').split('_');
                        if (parts.length >= 3) { type = parts[0]; label = parts[1]; url = parts.slice(2).join('_'); }
                    }
                    const bgColor = typeColorMap[type.toLowerCase()];
                    return `<a href="${url.replace(/&amp;/g, '&')}" target="_blank" class="download-btn animate-text wait-animation ${type.toLowerCase()}" style="display:inline-block; padding:10px 20px; ${bgColor ? `background:${bgColor};` : ''} color:white; text-decoration:none; border-radius:6px; margin-right:10px; margin-bottom:10px; font-family: sans-serif; font-weight: bold; font-size: 14px;"><i class="${iconMap[label.toLowerCase()] || 'fas fa-link'}"></i> ${label}</a>`;
                });
            } else {
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
                    return `<div class="img-container animate-text wait-animation" style="margin: 20px 0; ${indentStyle} text-align: ${pos === 'left' ? 'left' : (pos === 'right' ? 'right' : 'center')};"><img src="${src.replace(/&amp;/g, '&')}" style="width: ${size}; max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);" alt="Image"></div>`;
                });
            }
        });
    };

    lines.forEach((line) => {
        // 0. CALCULATE INDENTATION (4 spaces = 1 level, 1 tab = 1 level/4 spaces)
        const leadingWhitespace = line.match(/^[\t ]*/)[0];
        let spaceCount = 0;
        for (const char of leadingWhitespace) {
            if (char === '\t') spaceCount += 4;
            else spaceCount += 1;
        }
        const indentLevel = Math.floor(spaceCount / 4);
        const indentPx = indentLevel * 25; // 25px per level
        const indentStyle = indentLevel > 0 ? `margin-left: ${indentPx}px;` : '';

        const trimmedLine = line.trim();

        // 1. LISTS
        const isUl = trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ');
        const isOl = /^\d+\.\s/.test(trimmedLine);

        if (isUl || isOl) {
            const newListType = isUl ? 'ul' : 'ol';
            
            if (!inList) {
                inList = true;
                listType = newListType;
                html += `<${listType} class="animate-text wait-animation" style="margin-left: 20px; margin-bottom: 10px;">\n`;
            } else if (listType !== newListType) {
                html += `</${listType}>\n`;
                listType = newListType;
                html += `<${listType} class="animate-text wait-animation" style="margin-left: 20px; margin-bottom: 10px;">\n`;
            }

            const content = trimmedLine.substring(isUl ? 2 : trimmedLine.indexOf(' ') + 1);
            
            // PROCESS CONTENT: Preprocess media -> Inline MD -> Restore media
            const pre = preprocessMedia(content);
            const mid = processInlineMarkdown(pre.text);
            const final = restoreMedia(mid, pre.placeholders, ''); // No extra indent inside LI
            
            html += `<li style="margin-bottom: 5px; ${indentStyle}">${final}</li>\n`;
            return;
        } else if (inList) {
            html += `</${listType}>\n`;
            inList = false;
        }

        // 2. CODE BLOCKS
        if (trimmedLine.startsWith('```')) {
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
            html += `<hr class="animate-text wait-animation" style="border: 0; border-top: 1px solid #333; margin: 20px 0; ${indentStyle}">`;
            return;
        }

        // 4. LINE PROCESSING
        let processedLine = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // Headers
        if (processedLine.startsWith('### ')) processedLine = `<h3 class="animate-text wait-animation" style="color: #58A6FF; ${indentStyle}">${processedLine.substring(4)}</h3>`;
        else if (processedLine.startsWith('## ')) processedLine = `<h2 class="animate-text wait-animation" style="color: #58A6FF; ${indentStyle}">${processedLine.substring(3)}</h2>`;
        else if (processedLine.startsWith('# ')) processedLine = `<h1 class="animate-text wait-animation" style="color: #58A6FF; ${indentStyle}">${processedLine.substring(2)}</h1>`;
        
        // Quotes
        if (processedLine.startsWith('&gt; ')) {
            processedLine = `<blockquote class="animate-text wait-animation" style="${indentStyle}">${processedLine.substring(5)}</blockquote>`;
        }

        // TEMPORARY PLACEHOLDERS
        const pre = preprocessMedia(processedLine);
        processedLine = pre.text;

        // Process MD inside tags or paragraphs
        if (processedLine.startsWith('<h') || processedLine.startsWith('<blockquote')) {
            processedLine = processedLine.replace(/>(.*?)<\//, (m, inner) => `>${processInlineMarkdown(inner)}</`); 
        } else if (!processedLine.startsWith('<')) {
            processedLine = processInlineMarkdown(processedLine);
            processedLine = (trimmedLine === '') ? '<br>' : `<p class="animate-text wait-animation" style="${indentStyle}">${processedLine}</p>`;
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
        .replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
            const isExternal = url.startsWith('http');
            // Beautiful numbering for internal links
            if (!isExternal && /^\d+$/.test(text)) {
                 return `<a href="${url}" class="number-badge" style="
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
            return `<a href="${url}"${isExternal ? ' target="_blank"' : ''} style="color: #58A6FF; text-decoration: underline;">${text}</a>`;
        });
}
