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
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
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
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
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
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
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
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
    }
  }
);

export const inviteUserToFolder = createAsyncThunk(
  "folders/inviteUserToFolder",
  async ({ id, userId, email, permission }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const body = {};
      if (userId) body.userId = userId;
      if (email) body.email = email;
      if (permission) body.permission = permission;

      const url = userId ? `${API_BASE}/folders/${id}/invite/${userId}` : `${API_BASE}/folders/${id}/invite`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to invite user");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
    }
  }
);

export const removeUserFromFolder = createAsyncThunk(
  "folders/removeUserFromFolder",
  async ({ id, userId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await fetch(`${API_BASE}/folders/${id}/invite/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to remove user from folder");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
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
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
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
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
    }
  }
);

export const fetchSharedFolders = createAsyncThunk(
  "folders/fetchSharedFolders",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await fetch(`${API_BASE}/folders/shared`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to fetch shared folders");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
    }
  }
);

export const updateCollaboratorPermission = createAsyncThunk(
  "folders/updateCollaboratorPermission",
  async ({ id, userId, email, permission }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const targetId = userId || email;
      const response = await fetch(
        `${API_BASE}/folders/${id}/collaborators/${targetId}/permission`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ permission }),
        }
      );
      const data = await response.json();
      if (!response.ok)
        return rejectWithValue(
          data.message || "Failed to update collaborator permission"
        );
      return data;
    } catch (err) {
      return rejectWithValue(
        err.message || "Network error. Unable to connect to server."
      );
    }
  }
);


const initialState = {
  folders: [],
  sharedFolders: [],
  isLoading: false,
  isLoadingShared: false,
  isCreating: false,
  isSharing: false,
  isAddingResource: false,
  deletingFolderId: null,
  removingResourceId: null,
  updatingPermissionUserId: null,
  error: null,
  sharedError: null,
};

const folderSlice = createSlice({
  name: "folders",
  initialState,
  reducers: {
    clearFolderError: (state) => {
      state.error = null;
      state.sharedError = null;
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

      // Fetch Shared Folders
      .addCase(fetchSharedFolders.pending, (state) => {
        state.isLoadingShared = true;
        state.sharedError = null;
      })
      .addCase(fetchSharedFolders.fulfilled, (state, action) => {
        state.isLoadingShared = false;
        state.sharedFolders = action.payload;
      })
      .addCase(fetchSharedFolders.rejected, (state, action) => {
        state.isLoadingShared = false;
        state.sharedError = action.payload;
      })

      // Create Folder
      .addCase(createFolder.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createFolder.fulfilled, (state, action) => {
        state.isCreating = false;
        state.folders.unshift(action.payload);
      })
      .addCase(createFolder.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })

      // Delete Folder
      .addCase(deleteFolder.pending, (state, action) => {
        state.deletingFolderId = action.meta.arg;
        state.error = null;
      })
      .addCase(deleteFolder.fulfilled, (state, action) => {
        state.deletingFolderId = null;
        state.folders = state.folders.filter((f) => f._id !== action.payload);
        state.sharedFolders = state.sharedFolders.filter((f) => f._id !== action.payload);
      })
      .addCase(deleteFolder.rejected, (state, action) => {
        state.deletingFolderId = null;
        state.error = action.payload;
      })

      // Share Folder
      .addCase(shareFolder.pending, (state) => {
        state.isSharing = true;
        state.error = null;
      })
      .addCase(shareFolder.fulfilled, (state, action) => {
        state.isSharing = false;
        state.folders = state.folders.map((f) =>
          f._id === action.payload._id ? action.payload : f
        );
        state.sharedFolders = state.sharedFolders.map((f) =>
          f._id === action.payload._id ? action.payload : f
        );
      })
      .addCase(shareFolder.rejected, (state, action) => {
        state.isSharing = false;
        state.error = action.payload;
      })

      // Invite User to Folder
      .addCase(inviteUserToFolder.pending, (state) => {
        state.isSharing = true;
        state.error = null;
      })
      .addCase(inviteUserToFolder.fulfilled, (state, action) => {
        state.isSharing = false;
        state.folders = state.folders.map((f) =>
          f._id === action.payload._id ? action.payload : f
        );
        state.sharedFolders = state.sharedFolders.map((f) =>
          f._id === action.payload._id ? action.payload : f
        );
      })
      .addCase(inviteUserToFolder.rejected, (state, action) => {
        state.isSharing = false;
        state.error = action.payload;
      })

      // Update Collaborator Permission
      .addCase(updateCollaboratorPermission.pending, (state, action) => {
        state.updatingPermissionUserId = action.meta.arg.userId || action.meta.arg.email;
        state.error = null;
      })
      .addCase(updateCollaboratorPermission.fulfilled, (state, action) => {
        state.updatingPermissionUserId = null;
        state.folders = state.folders.map((f) =>
          f._id === action.payload._id ? action.payload : f
        );
        state.sharedFolders = state.sharedFolders.map((f) =>
          f._id === action.payload._id ? action.payload : f
        );
      })
      .addCase(updateCollaboratorPermission.rejected, (state, action) => {
        state.updatingPermissionUserId = null;
        state.error = action.payload;
      })

      // Remove User from Folder
      .addCase(removeUserFromFolder.pending, (state) => {
        state.error = null;
      })
      .addCase(removeUserFromFolder.fulfilled, (state, action) => {
        state.folders = state.folders.map((f) =>
          f._id === action.payload._id ? action.payload : f
        );
        state.sharedFolders = state.sharedFolders.map((f) =>
          f._id === action.payload._id ? action.payload : f
        );
      })
      .addCase(removeUserFromFolder.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Add resource to folder
      .addCase(addResourceToFolder.pending, (state) => {
        state.isAddingResource = true;
        state.error = null;
      })
      .addCase(addResourceToFolder.fulfilled, (state, action) => {
        state.isAddingResource = false;
        state.folders = state.folders.map((f) =>
          f._id === action.payload._id ? action.payload : f
        );
        state.sharedFolders = state.sharedFolders.map((f) =>
          f._id === action.payload._id ? action.payload : f
        );
      })
      .addCase(addResourceToFolder.rejected, (state, action) => {
        state.isAddingResource = false;
        state.error = action.payload;
      })

      // Remove resource from folder
      .addCase(removeResourceFromFolder.pending, (state, action) => {
        state.removingResourceId = action.meta.arg.resourceId;
        state.error = null;
      })
      .addCase(removeResourceFromFolder.fulfilled, (state, action) => {
        state.removingResourceId = null;
        state.folders = state.folders.map((f) =>
          f._id === action.payload._id ? action.payload : f
        );
        state.sharedFolders = state.sharedFolders.map((f) =>
          f._id === action.payload._id ? action.payload : f
        );
      })
      .addCase(removeResourceFromFolder.rejected, (state, action) => {
        state.removingResourceId = null;
        state.error = action.payload;
      });
  },
});

export const { clearFolderError } = folderSlice.actions;
export default folderSlice.reducer;
