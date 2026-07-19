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
      return rejectWithValue(err.message || "Network error");
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
      return rejectWithValue(err.message || "Network error");
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
      return rejectWithValue(err.message || "Network error");
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
      return id; // Return the deleted resource ID
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
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
      return rejectWithValue(err.message || "Network error");
    }
  }
);

const initialState = {
  resources: [],
  isLoading: false,
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
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createResource.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resources.unshift(action.payload);
      })
      .addCase(createResource.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Resource
      .addCase(updateResource.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateResource.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resources = state.resources.map((r) =>
          r._id === action.payload._id ? action.payload : r
        );
      })
      .addCase(updateResource.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete Resource
      .addCase(deleteResource.fulfilled, (state, action) => {
        state.resources = state.resources.filter((r) => r._id !== action.payload);
      })
      // Download count increment
      .addCase(downloadResource.fulfilled, (state, action) => {
        state.resources = state.resources.map((r) =>
          r._id === action.payload.id ? { ...r, downloadCount: action.payload.downloadCount } : r
        );
      });
  },
});

export const { setFilters, resetFilters } = resourceSlice.actions;
export default resourceSlice.reducer;
