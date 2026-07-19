import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import resourceReducer from "./resourceSlice";
import folderReducer from "./folderSlice";
import analyticsReducer from "./analyticsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    resources: resourceReducer,
    folders: folderReducer,
    analytics: analyticsReducer,
  },
});
export default store;
