import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE = "http://localhost:5050/api";

export const fetchAnalytics = createAsyncThunk(
  "analytics/fetchAnalytics",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append("startDate", params.startDate);
      if (params?.endDate) queryParams.append("endDate", params.endDate);

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const token = getState()?.auth?.token;
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/analytics${queryString}`, { headers });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to fetch analytics");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
    }
  }
);

export const exportAnalyticsCsv = createAsyncThunk(
  "analytics/exportAnalyticsCsv",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append("startDate", params.startDate);
      if (params?.endDate) queryParams.append("endDate", params.endDate);
      if (params?.category) queryParams.append("category", params.category);
      if (params?.subject) queryParams.append("subject", params.subject);
      if (params?.gradeLevel) queryParams.append("gradeLevel", params.gradeLevel);

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const token = getState()?.auth?.token;
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/analytics/export${queryString}`, { headers });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to generate CSV usage report.");
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `resource_usage_report_${params?.startDate || "all"}_to_${params?.endDate || "all"}.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = await response.blob();
      return { blob, filename };
    } catch (err) {
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
    }
  }
);

const initialState = {
  data: {
    totalResources: 0,
    totalFolders: 0,
    totalTeachers: 0,
    totalDownloads: 0,
    categories: [],
    subjects: [],
    topResources: [],
    resourcesByDate: [],
  },
  isLoading: false,
  error: null,
  isExporting: false,
  exportError: null,
  exportSuccess: false,
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearExportStatus: (state) => {
      state.exportError = null;
      state.exportSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(exportAnalyticsCsv.pending, (state) => {
        state.isExporting = true;
        state.exportError = null;
        state.exportSuccess = false;
      })
      .addCase(exportAnalyticsCsv.fulfilled, (state) => {
        state.isExporting = false;
        state.exportSuccess = true;
        state.exportError = null;
      })
      .addCase(exportAnalyticsCsv.rejected, (state, action) => {
        state.isExporting = false;
        state.exportError = action.payload;
        state.exportSuccess = false;
      });
  },
});

export const { clearExportStatus } = analyticsSlice.actions;

export default analyticsSlice.reducer;
