'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Lỗi giao diện:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
      background: '#faf8f5',
      color: '#514735',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h2 style={{ fontSize: '1.4rem', marginBottom: '12px', color: '#79603d' }}>
        Đang tải thiệp cưới...
      </h2>
      <p style={{ maxWidth: '400px', marginBottom: '24px', fontSize: '0.95rem', opacity: 0.85 }}>
        Hệ thống đang làm mới kết nối. Bạn vui lòng bấm nút bên dưới để thử lại nhé.
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: '12px 28px',
          background: '#79603d',
          color: '#fff',
          border: 'none',
          borderRadius: '999px',
          fontSize: '0.95rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(121, 96, 61, 0.25)'
        }}
      >
        Tải lại thiệp
      </button>
    </div>
  );
}
