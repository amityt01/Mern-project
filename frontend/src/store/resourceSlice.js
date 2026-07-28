import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE = "http://localhost:5050/api";

export const fetchResources = createAsyncThunk(
  "resources/fetchResources",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const { category, subject, gradeLevel, search } = filters;
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (subject) params.append("subject", subject);
      if (gradeLevel) params.append("gradeLevel", gradeLevel);
      if (search) params.append("search", search);

      const queryString = params.toString();
      const url = `${API_BASE}/resources${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to fetch resources");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
    }
  }
);

export const fetchTopResources = createAsyncThunk(
  "resources/fetchTopResources",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/resources/top`);
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to fetch top resources");
      return Array.isArray(data) ? data : data.topResources || [];
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
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      let body;

      if (resourceData instanceof FormData) {
        body = resourceData;
      } else if (resourceData && (resourceData.fileObject || resourceData.file)) {
        const formData = new FormData();
        Object.keys(resourceData).forEach((key) => {
          if (key === "fileObject" || key === "file") {
            const fileVal = resourceData.fileObject || resourceData.file;
            if (fileVal instanceof File || fileVal instanceof Blob) {
              formData.append("file", fileVal);
            }
          } else if (resourceData[key] !== undefined && resourceData[key] !== null) {
            formData.append(key, resourceData[key]);
          }
        });
        body = formData;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(resourceData);
      }

      const response = await fetch(`${API_BASE}/resources`, {
        method: "POST",
        headers,
        body,
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to create resource");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
    }
  }
);

export const uploadResourceFile = createAsyncThunk(
  "resources/uploadResourceFile",
  async (file, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/resources/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to upload file");
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
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      let body;

      if (resourceData instanceof FormData) {
        body = resourceData;
      } else if (resourceData && (resourceData.fileObject || resourceData.file)) {
        const formData = new FormData();
        Object.keys(resourceData).forEach((key) => {
          if (key === "fileObject" || key === "file") {
            const fileVal = resourceData.fileObject || resourceData.file;
            if (fileVal instanceof File || fileVal instanceof Blob) {
              formData.append("file", fileVal);
            }
          } else if (resourceData[key] !== undefined && resourceData[key] !== null) {
            formData.append(key, resourceData[key]);
          }
        });
        body = formData;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(resourceData);
      }

      const response = await fetch(`${API_BASE}/resources/${id}`, {
        method: "PUT",
        headers,
        body,
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
  topResources: [],
  isLoading: false,
  isLoadingTop: false,
  isSaving: false,
  isUploading: false,
  deletingId: null,
  downloadingId: null,
  error: null,
  deleteError: null,
  topError: null,
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

      // Fetch Top Resources
      .addCase(fetchTopResources.pending, (state) => {
        state.isLoadingTop = true;
        state.topError = null;
      })
      .addCase(fetchTopResources.fulfilled, (state, action) => {
        state.isLoadingTop = false;
        state.topResources = action.payload;
      })
      .addCase(fetchTopResources.rejected, (state, action) => {
        state.isLoadingTop = false;
        state.topError = action.payload;
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

      // Upload Resource File
      .addCase(uploadResourceFile.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(uploadResourceFile.fulfilled, (state) => {
        state.isUploading = false;
      })
      .addCase(uploadResourceFile.rejected, (state, action) => {
        state.isUploading = false;
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
        state.deleteError = null;
      })
      .addCase(deleteResource.fulfilled, (state, action) => {
        state.deletingId = null;
        state.deleteError = null;
        state.resources = state.resources.filter((r) => r._id !== action.payload);
        state.topResources = state.topResources.filter((r) => r._id !== action.payload);
      })
      .addCase(deleteResource.rejected, (state, action) => {
        state.deletingId = null;
        state.deleteError = action.payload;
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
