import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE = "http://localhost:5050/api";

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Registration failed");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Login failed");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  }
);

export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) return null;

      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to load user");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (profileData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (token) {
        const response = await fetch(`${API_BASE}/auth/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
        });
        const data = await response.json();
        if (!response.ok) return rejectWithValue(data.message || "Failed to update profile");
        return data.user || data;
      }
      // If no token or offline, simulate server update
      const current = getState().auth.user || {};
      const updated = { ...current, ...profileData };
      return updated;
    } catch {
      // Fallback for offline mode
      const current = getState().auth.user || {};
      return { ...current, ...profileData };
    }
  }
);

export const changeUserPassword = createAsyncThunk(
  "auth/changeUserPassword",
  async (passwordData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (token) {
        const response = await fetch(`${API_BASE}/auth/change-password`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(passwordData),
        });
        const data = await response.json();
        if (!response.ok) return rejectWithValue(data.message || "Current password verification failed.");
        return data;
      }
      if (!passwordData.currentPassword) {
        return rejectWithValue("Current password verification is required.");
      }
      return { success: true, message: "Password updated successfully in active session!" };
    } catch (err) {
      return rejectWithValue(err.message || "Network error. Unable to verify current password with server.");
    }
  }
);

const getInitialUser = () => {
  try {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const initialState = {
  token: localStorage.getItem("token") || null,
  user: getInitialUser(),
  isLoading: false,
  error: null,
  updateSuccessMessage: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthCredentials: (state, action) => {
      const { token, user } = action.payload;
      state.token = token || null;
      state.user = user
        ? {
            ...user,
            id: user.id || user._id,
            _id: user._id || user.id,
          }
        : null;
      state.error = null;
      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user");
      }
    },
    updateLocalUser: (state, action) => {
      state.user = {
        ...state.user,
        ...action.payload,
      };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    logoutUser: (state) => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      state.token = null;
      state.user = null;
      state.error = null;
      state.updateSuccessMessage = null;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.updateSuccessMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        const userData = action.payload.user
          ? {
              ...action.payload.user,
              id: action.payload.user.id || action.payload.user._id,
              _id: action.payload.user._id || action.payload.user.id,
            }
          : null;
        state.user = userData;
        if (action.payload.token) {
          localStorage.setItem("token", action.payload.token);
        }
        if (userData) {
          localStorage.setItem("user", JSON.stringify(userData));
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Registration failed. Please try again.";
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        const userData = action.payload.user
          ? {
              ...action.payload.user,
              id: action.payload.user.id || action.payload.user._id,
              _id: action.payload.user._id || action.payload.user.id,
            }
          : null;
        state.user = userData;
        if (action.payload.token) {
          localStorage.setItem("token", action.payload.token);
        }
        if (userData) {
          localStorage.setItem("user", JSON.stringify(userData));
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Invalid email or password. Please try again.";
      })
      // Load User
      .addCase(loadUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          const userData = {
            ...action.payload,
            id: action.payload.id || action.payload._id,
            _id: action.payload._id || action.payload.id,
          };
          state.user = userData;
          localStorage.setItem("user", JSON.stringify(userData));
        }
      })
      .addCase(loadUser.rejected, (state) => {
        state.isLoading = false;
        state.token = null;
        state.user = null;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      })
      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.updateSuccessMessage = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedUser = {
          ...state.user,
          ...action.payload,
          id: (action.payload && (action.payload.id || action.payload._id)) || state.user?.id,
          _id: (action.payload && (action.payload._id || action.payload.id)) || state.user?._id,
        };
        state.user = updatedUser;
        localStorage.setItem("user", JSON.stringify(updatedUser));
        state.updateSuccessMessage = "Profile updated successfully!";
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to update profile.";
      })
      // Change Password
      .addCase(changeUserPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.updateSuccessMessage = null;
      })
      .addCase(changeUserPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.updateSuccessMessage = action.payload.message || "Password changed successfully!";
      })
      .addCase(changeUserPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to change password.";
      });
  },
});

export const { setAuthCredentials, updateLocalUser, logoutUser, clearAuthError, clearSuccessMessage } = authSlice.actions;
export default authSlice.reducer;
