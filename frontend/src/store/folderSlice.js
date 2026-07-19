import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE = "http://localhost:5050/api";

export const fetchFolders = createAsyncThunk(
  "folders/fetchFolders",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await fetch(`${API_BASE}/folders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to fetch folders");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  }
);

export const createFolder = createAsyncThunk(
  "folders/createFolder",
  async (folderData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await fetch(`${API_BASE}/folders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(folderData),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to create folder");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  }
);

export const deleteFolder = createAsyncThunk(
  "folders/deleteFolder",
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await fetch(`${API_BASE}/folders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to delete folder");
      return id;
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  }
);

export const shareFolder = createAsyncThunk(
  "folders/shareFolder",
  async ({ id, email, permission }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await fetch(`${API_BASE}/folders/${id}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, permission }),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to share folder");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  }
);

export const addResourceToFolder = createAsyncThunk(
  "folders/addResourceToFolder",
  async ({ id, resourceId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await fetch(`${API_BASE}/folders/${id}/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resourceId }),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to add resource to folder");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  }
);

export const removeResourceFromFolder = createAsyncThunk(
  "folders/removeResourceFromFolder",
  async ({ id, resourceId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await fetch(`${API_BASE}/folders/${id}/resources/${resourceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to remove resource");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  }
);

const initialState = {
  folders: [],
  isLoading: false,
  error: null,
};

const folderSlice = createSlice({
  name: "folders",
  initialState,
  reducers: {
    clearFolderError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Folders
      .addCase(fetchFolders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFolders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.folders = action.payload;
      })
      .addCase(fetchFolders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Folder
      .addCase(createFolder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createFolder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.folders.unshift(action.payload);
      })
      .addCase(createFolder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete Folder
      .addCase(deleteFolder.fulfilled, (state, action) => {
        state.folders = state.folders.filter((f) => f._id !== action.payload);
      })
      // Share Folder
      .addCase(shareFolder.fulfilled, (state, action) => {
        state.folders = state.folders.map((f) =>
          f._id === action.payload._id ? action.payload : f
        );
      })
      .addCase(shareFolder.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Add resource to folder
      .addCase(addResourceToFolder.fulfilled, (state, action) => {
        state.folders = state.folders.map((f) =>
          f._id === action.payload._id ? action.payload : f
        );
      })
      .addCase(addResourceToFolder.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Remove resource from folder
      .addCase(removeResourceFromFolder.fulfilled, (state, action) => {
        state.folders = state.folders.map((f) =>
          f._id === action.payload._id ? action.payload : f
        );
      });
  },
});

export const { clearFolderError } = folderSlice.actions;
export default folderSlice.reducer;
