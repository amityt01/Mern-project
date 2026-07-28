import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE = "http://localhost:5050/api";

export const fetchAnalytics = createAsyncThunk(
  "analytics/fetchAnalytics",
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append("startDate", params.startDate);
      if (params?.endDate) queryParams.append("endDate", params.endDate);

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const response = await fetch(`${API_BASE}/analytics${queryString}`);
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to fetch analytics");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
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
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {},
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
      });
  },
});

export default analyticsSlice.reducer;
