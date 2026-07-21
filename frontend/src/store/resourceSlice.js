import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE = "http://localhost:5050/api";

export const fetchResources = createAsyncThunk(
  "resources/fetchResources",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const { category, subject, gradeLevel, search } = filters;
      let url = new URL(`${API_BASE}/resources`);
      if (category) url.searchParams.append("category", category);
      if (subject) url.searchParams.append("subject", subject);
      if (gradeLevel) url.searchParams.append("gradeLevel", gradeLevel);
      if (search) url.searchParams.append("search", search);

      const response = await fetch(url.toString());
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to fetch resources");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
    }
  }
);

export const createResource = createAsyncThunk(
  "resources/createResource",
  async (resourceData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await fetch(`${API_BASE}/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(resourceData),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to create resource");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
    }
  }
);

export const updateResource = createAsyncThunk(
  "resources/updateResource",
  async ({ id, resourceData }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await fetch(`${API_BASE}/resources/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(resourceData),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to update resource");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
    }
  }
);

export const deleteResource = createAsyncThunk(
  "resources/deleteResource",
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await fetch(`${API_BASE}/resources/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to delete resource");
      return id;
    } catch (err) {
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
    }
  }
);

export const downloadResource = createAsyncThunk(
  "resources/downloadResource",
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/resources/${id}/download`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Download request failed");
      return { id, downloadCount: data.downloadCount };
    } catch (err) {
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
    }
  }
);

const initialState = {
  resources: [],
  isLoading: false,
  isSaving: false,
  deletingId: null,
  downloadingId: null,
  error: null,
  filters: {
    category: "",
    subject: "",
    gradeLevel: "",
    search: "",
  },
};

const resourceSlice = createSlice({
  name: "resources",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = { category: "", subject: "", gradeLevel: "", search: "" };
    },
    clearResourceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Resources
      .addCase(fetchResources.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resources = action.payload;
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create Resource
      .addCase(createResource.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(createResource.fulfilled, (state, action) => {
        state.isSaving = false;
        state.resources.unshift(action.payload);
      })
      .addCase(createResource.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      // Update Resource
      .addCase(updateResource.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateResource.fulfilled, (state, action) => {
        state.isSaving = false;
        state.resources = state.resources.map((r) =>
          r._id === action.payload._id ? action.payload : r
        );
      })
      .addCase(updateResource.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      // Delete Resource
      .addCase(deleteResource.pending, (state, action) => {
        state.deletingId = action.meta.arg;
        state.error = null;
      })
      .addCase(deleteResource.fulfilled, (state, action) => {
        state.deletingId = null;
        state.resources = state.resources.filter((r) => r._id !== action.payload);
      })
      .addCase(deleteResource.rejected, (state, action) => {
        state.deletingId = null;
        state.error = action.payload;
      })

      // Download count increment
      .addCase(downloadResource.pending, (state, action) => {
        state.downloadingId = action.meta.arg;
      })
      .addCase(downloadResource.fulfilled, (state, action) => {
        state.downloadingId = null;
        state.resources = state.resources.map((r) =>
          r._id === action.payload.id ? { ...r, downloadCount: action.payload.downloadCount } : r
        );
      })
      .addCase(downloadResource.rejected, (state) => {
        state.downloadingId = null;
      });
  },
});

export const { setFilters, resetFilters, clearResourceError } = resourceSlice.actions;
export default resourceSlice.reducer;
