export function extractHtmlBody(email: any): string {
    // 1. Direct HTML body (Aurinko simplified)
    if (email.htmlBody) {
        return email.htmlBody;
    }

    // 2. Body object with content
    if (email.body?.contentType === 'text/html') {
        return email.body.content;
    }

    // 3. Payload parts (Gmail/Aurinko raw format)
    if (email.payload?.parts) {
        const htmlPart = findHtmlPart(email.payload.parts);
        if (htmlPart) {
            // Decode base64 if needed (Aurinko usually handles this, but raw might not)
            if (htmlPart.body?.data) {
                return Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
            }
            return htmlPart.body?.content || '';
        }
    }

    // 4. Fallback to text body converted to HTML
    let textContent = email.textBody || email.snippet || '';

    // Check if 'body' is string (common Aurinko text body) or object
    if (!textContent && email.body) {
        if (typeof email.body === 'string') {
            textContent = email.body;
        } else if (email.body.content) {
            textContent = email.body.content;
        }
    }

    if (textContent) {
        return convertTextToHtml(textContent);
    }

    return '';
}

function findHtmlPart(parts: any[]): any {
    for (const part of parts) {
        if (part.mimeType === 'text/html') {
            return part;
        }
        // Recurse
        if (part.parts) {
            const found = findHtmlPart(part.parts);
            if (found) return found;
        }
    }
    return null;
}

function convertTextToHtml(text: string): string {
    if (!text) return '';
    // If it looks like HTML, return as-is
    if (text.includes('<div') || text.includes('<p') || text.includes('<br')) {
        return text;
    }

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}
