'use client';

import { useEffect } from 'react';

/** Keep every file picker in the commerce UI image-only. Server routes still enforce MIME/signature validation. */
export function ImageUploadGuard() {
  useEffect(() => {
    const apply = (root: ParentNode) => {
      root.querySelectorAll?.('input[type="file"]').forEach((input) => input.setAttribute('accept', 'image/*'));
    };
    apply(document);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) apply(node as Element);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
