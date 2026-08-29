import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Avoid top scroll reset on active chat view to prevent breaking chat message history
    if (pathname.startsWith('/chat/')) {
      return;
    }

    try {
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
          ? 'auto'
          : 'smooth'
      });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
