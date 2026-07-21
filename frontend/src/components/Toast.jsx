import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeToast } from "../store/toastSlice";

function ToastItem({ toast }) {
  const dispatch = useDispatch();
  const { id, type, title, message, duration } = toast;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        dispatch(removeToast(id));
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, dispatch]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg className="toast-icon success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      case "error":
        return (
          <svg className="toast-icon error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case "warning":
        return (
          <svg className="toast-icon warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      default:
        return (
          <svg className="toast-icon info" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  return (
    <div className={`toast-item toast-${type}`}>
      <div className="toast-content">
        {getIcon()}
        <div className="toast-text-group">
          {title && <h4 className="toast-title">{title}</h4>}
          <p className="toast-message">{message}</p>
        </div>
      </div>
      <button
        className="toast-close-btn"
        onClick={() => dispatch(removeToast(id))}
        aria-label="Close notification"
      >
        &times;
      </button>
      {duration > 0 && (
        <div
          className="toast-progress-bar"
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useSelector((state) => state.toast.toasts);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
