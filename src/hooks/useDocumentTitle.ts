import { useEffect } from 'react';

const BASE_TITLE = 'Kartly | ShopNow';

/**
 * Sets the browser tab title for the page that calls it, restoring the
 * base title on unmount. Without this, every page shared the same
 * static "Kartly | ShopNow" from index.html — browser tabs, history
 * entries, and bookmarks all looked identical regardless of which page
 * was actually open.
 */
export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} | ${BASE_TITLE}`;
    return () => {
      document.title = previous;
    };
  }, [title]);
};
