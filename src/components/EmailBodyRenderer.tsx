'use client';

import { useEffect, useRef } from 'react';

interface EmailBodyRendererProps {
    html: string;
    className?: string;
}

export function EmailBodyRenderer({ html, className = '' }: EmailBodyRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current && html) {
            // Basic client-side sanitization could happen here if not strict enough
            // For now, we trust the input but ensure styles allow images
            const sanitized = sanitizeEmailHtml(html);
            containerRef.current.innerHTML = sanitized;

            // Post-process images
            const images = containerRef.current.querySelectorAll('img');
            images.forEach((img) => {
                // Error handling
                img.onerror = () => {
                    img.style.display = 'none';
                };
                img.loading = 'lazy';
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
            });

            // Post-process links to open in new tab
            const links = containerRef.current.querySelectorAll('a');
            links.forEach((a) => {
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
            });
        }
    }, [html]);

    return (
        <div
            ref={containerRef}
            className={`email-body-content ${className}`}
        />
    );
}

function sanitizeEmailHtml(html: string): string {
    if (typeof window === 'undefined') return html; // Server side, return as is (hydration mismatch risk but handled by effect)

    // Create a temporary container
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove dangerous elements but KEEP images
    const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form'];
    dangerousTags.forEach(tag => {
        temp.querySelectorAll(tag).forEach(el => el.remove());
    });

    // Remove dangerous attributes
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(el => {
        // Remove event handlers
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('on')) {
                el.removeAttribute(attr.name);
            }
        });

        // Remove javascript: URLs
        if (el.tagName !== 'IMG') {
            const href = el.getAttribute('href');
            if (href?.startsWith('javascript:')) {
                el.removeAttribute('href');
            }
        }
    });

    return temp.innerHTML;
}
