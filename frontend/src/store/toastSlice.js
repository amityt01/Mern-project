import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  toasts: [],
};

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    addToast: (state, action) => {
      const { id, type = "info", message, title, duration = 4000 } = action.payload;
      const toastId = id || Date.now() + Math.random().toString(36).substring(2, 9);
      state.toasts.push({
        id: toastId,
        type, // 'success' | 'error' | 'warning' | 'info'
        title,
        message,
        duration,
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const { addToast, removeToast, clearToasts } = toastSlice.actions;

// Helper function to dispatch toast easily
export const notify = (dispatch, type, message, title, duration) => {
  dispatch(addToast({ type, message, title, duration }));
};

export default toastSlice.reducer;
