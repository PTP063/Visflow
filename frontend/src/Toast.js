// Toast.js
// Minimal, dependency-free toast so pipeline results don't rely on the
// browser's native alert() — matches the rest of the app's visual language.

import { useEffect } from 'react';
import './toast.css';

export const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.variant || 'info'}`}>
      <div className="toast-header">
        <span className="toast-title">{toast.title}</span>
        <button className="toast-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      {toast.rows && (
        <div className="toast-rows">
          {toast.rows.map((row) => (
            <div className="toast-row" key={row.label}>
              <span className="toast-row-label">{row.label}</span>
              <span className="toast-row-value">{row.value}</span>
            </div>
          ))}
        </div>
      )}
      {toast.message && <div className="toast-message">{toast.message}</div>}
    </div>
  );
};
