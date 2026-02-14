// client/src/pages/share.tsx
import { useEffect } from 'react';

export default function SharePage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const article = params.get('article');
    
    if (article) {
      sessionStorage.setItem('newsletter_article', article);
      localStorage.setItem('newsletter_article', article);
      document.cookie = `newsletter_article=${article}; path=/; max-age=60`;
    }
    
    // Use replace instead of href for smoother transition
    window.location.replace('/newsletter');
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      color: '#06b6d4',
      zIndex: 9999
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #1e293b',
        borderTopColor: '#06b6d4',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}