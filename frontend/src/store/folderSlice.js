import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { deleteResource } from "./resourceSlice";

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

export const fetchFolderById = createAsyncThunk(
  "folders/fetchFolderById",
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await fetch(`${API_BASE}/folders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to fetch folder");
      return data.folder || data;
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
      const url = userId
        ? `${API_BASE}/folders/${id}/collaborators/${userId}/permission`
        : `${API_BASE}/folders/${id}/collaborators/permission`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, email, permission }),
      });
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.message || "Failed to update permission");
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Network error. Unable to connect to server.");
    }
  }
);


const initialState = {
  folders: [],
  sharedFolders: [],
  selectedFolder: null,
  selectedFolderId: null,
  isLoadingFolder: false,
  selectedFolderError: null,
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
      state.selectedFolderError = null;
    },
    setSelectedFolder: (state, action) => {
      state.selectedFolder = action.payload;
      state.selectedFolderId = action.payload
        ? action.payload._id || action.payload.id
        : null;
      state.selectedFolderError = null;
    },
    setSelectedFolderId: (state, action) => {
      state.selectedFolderId = action.payload;
      if (!action.payload) {
        state.selectedFolder = null;
        state.selectedFolderError = null;
      }
    },
    clearSelectedFolder: (state) => {
      state.selectedFolder = null;
      state.selectedFolderId = null;
      state.selectedFolderError = null;
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
        if (state.selectedFolderId) {
          const match = action.payload.find(
            (f) => f._id === state.selectedFolderId || f.id === state.selectedFolderId
          );
          if (match) {
            state.selectedFolder = match;
            state.selectedFolderError = null;
          }
        }
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
        if (state.selectedFolderId) {
          const match = action.payload.find(
            (f) => f._id === state.selectedFolderId || f.id === state.selectedFolderId
          );
          if (match) {
            state.selectedFolder = match;
            state.selectedFolderError = null;
          }
        }
      })
      .addCase(fetchSharedFolders.rejected, (state, action) => {
        state.isLoadingShared = false;
        state.sharedError = action.payload;
      })

      // Fetch Folder By ID
      .addCase(fetchFolderById.pending, (state) => {
        state.isLoadingFolder = true;
        state.selectedFolderError = null;
      })
      .addCase(fetchFolderById.fulfilled, (state, action) => {
        state.isLoadingFolder = false;
        state.selectedFolder = action.payload;
        state.selectedFolderId = action.payload._id || action.payload.id;
        state.selectedFolderError = null;
      })
      .addCase(fetchFolderById.rejected, (state, action) => {
        state.isLoadingFolder = false;
        state.selectedFolder = null;
        state.selectedFolderError = action.payload || "Folder not found or access denied.";
      })

      // Create Folder
      .addCase(createFolder.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createFolder.fulfilled, (state, action) => {
        state.isCreating = false;
        if (!Array.isArray(state.folders)) {
          state.folders = [action.payload];
        } else {
          state.folders = [
            action.payload,
            ...state.folders.filter((f) => f._id !== action.payload._id),
          ];
        }
        state.selectedFolder = action.payload;
        state.selectedFolderId = action.payload._id || action.payload.id;
        state.selectedFolderError = null;
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
        if (
          state.selectedFolderId === action.payload ||
          state.selectedFolder?._id === action.payload
        ) {
          state.selectedFolder = null;
          state.selectedFolderId = null;
          state.selectedFolderError = null;
        }
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
        if (state.selectedFolder && state.selectedFolder._id === action.payload._id) {
          state.selectedFolder = action.payload;
        }
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
        if (state.selectedFolder && state.selectedFolder._id === action.payload._id) {
          state.selectedFolder = action.payload;
        }
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
        if (state.selectedFolder && state.selectedFolder._id === action.payload._id) {
          state.selectedFolder = action.payload;
        }
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
        if (state.selectedFolder && state.selectedFolder._id === action.payload._id) {
          state.selectedFolder = action.payload;
        }
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
        if (state.selectedFolder && state.selectedFolder._id === action.payload._id) {
          state.selectedFolder = action.payload;
        }
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
        if (state.selectedFolder && state.selectedFolder._id === action.payload._id) {
          state.selectedFolder = action.payload;
        }
      })
      .addCase(removeResourceFromFolder.rejected, (state, action) => {
        state.removingResourceId = null;
        state.error = action.payload;
      })

      // Synchronize folder state when a resource is deleted
      .addCase(deleteResource.fulfilled, (state, action) => {
        const deletedId = action.payload;
        const removeDeletedResource = (folder) => ({
          ...folder,
          resources: Array.isArray(folder.resources)
            ? folder.resources.filter((r) =>
                typeof r === "object" && r !== null ? r._id !== deletedId : r !== deletedId
              )
            : folder.resources,
        });
        state.folders = state.folders.map(removeDeletedResource);
        state.sharedFolders = state.sharedFolders.map(removeDeletedResource);
        if (state.selectedFolder) {
          state.selectedFolder = removeDeletedResource(state.selectedFolder);
        }
      });
  },
});

export const {
  clearFolderError,
  setSelectedFolder,
  setSelectedFolderId,
  clearSelectedFolder,
} = folderSlice.actions;

export default folderSlice.reducer;
