"use client";

// Helper to safely check if we're in a browser environment
const isBrowser = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

// Helper to safely access localStorage
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser()) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silently fail if localStorage is not available
    }
  },
  removeItem: (key: string): void => {
    if (!isBrowser()) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail if localStorage is not available
    }
  },
};

interface StorageInfo {
  used: number;
  available: number;
  percentage: number;
}

interface ApplicationState {
  tasksData?: any;
  selectedTaskId?: string;
  filter?: any;
  expandedTasks?: string[];
}

interface PersistedFile {
  name: string;
  content: string;
  uploadedAt: string;
  checksum: string;
}

class PersistenceManager {
  private readonly STORAGE_KEY = "taskmaster_app_state";
  private readonly FILE_KEY = "taskmaster_files";
  private readonly MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly CLEANUP_THRESHOLD = 0.8; // Clean up when 80% full

  async saveAll(state: ApplicationState): Promise<void> {
    if (!isBrowser()) {
      console.warn("⚠️ Cannot save state: not in browser environment");
      return;
    }

    try {
      // Save to localStorage first (faster, smaller data)
      const lightState = {
        selectedTaskId: state.selectedTaskId,
        filter: state.filter,
        expandedTasks: state.expandedTasks,
        savedAt: new Date().toISOString(),
      };
      safeLocalStorage.setItem(
        this.STORAGE_KEY + "_light",
        JSON.stringify(lightState),
      );

      // Save heavy data to IndexedDB if available
      if (this.isIndexedDBAvailable() && state.tasksData) {
        await this.saveToIndexedDB(this.STORAGE_KEY, state.tasksData);
      } else if (state.tasksData) {
        // Fallback to localStorage with compression
        const compressedData = this.compressData(
          JSON.stringify(state.tasksData),
        );
        safeLocalStorage.setItem(this.STORAGE_KEY + "_tasks", compressedData);
      }

      console.log("✅ State saved successfully");
    } catch (error) {
      console.error("❌ Failed to save state:", error);
      throw error;
    }
  }

  async restoreAll(): Promise<ApplicationState | null> {
    if (!isBrowser()) {
      console.warn("⚠️ Cannot restore state: not in browser environment");
      return null;
    }

    try {
      let state: ApplicationState = {};

      // Restore light state from localStorage
      const lightStateStr = safeLocalStorage.getItem(
        this.STORAGE_KEY + "_light",
      );
      if (lightStateStr) {
        const lightState = JSON.parse(lightStateStr);
        state = { ...state, ...lightState };
      }

      // Restore heavy data
      if (this.isIndexedDBAvailable()) {
        const tasksData = await this.restoreFromIndexedDB(this.STORAGE_KEY);
        if (tasksData) {
          state.tasksData = tasksData;
        }
      } else {
        // Fallback to localStorage
        const compressedData = safeLocalStorage.getItem(
          this.STORAGE_KEY + "_tasks",
        );
        if (compressedData) {
          const decompressed = this.decompressData(compressedData);
          state.tasksData = JSON.parse(decompressed);
        }
      }

      return Object.keys(state).length > 0 ? state : null;
    } catch (error) {
      console.error("❌ Failed to restore state:", error);
      return null;
    }
  }

  async clearAll(): Promise<void> {
    if (!isBrowser()) {
      console.warn("⚠️ Cannot clear data: not in browser environment");
      return;
    }

    try {
      // Clear localStorage
      safeLocalStorage.removeItem(this.STORAGE_KEY + "_light");
      safeLocalStorage.removeItem(this.STORAGE_KEY + "_tasks");
      safeLocalStorage.removeItem(this.FILE_KEY);

      // Clear IndexedDB
      if (this.isIndexedDBAvailable()) {
        await this.clearIndexedDB();
      }

      console.log("✅ All data cleared successfully");
    } catch (error) {
      console.error("❌ Failed to clear data:", error);
      throw error;
    }
  }

  async saveFile(file: File, content: string): Promise<void> {
    try {
      const fileData: PersistedFile = {
        name: file.name,
        content,
        uploadedAt: new Date().toISOString(),
        checksum: this.calculateChecksum(content),
      };

      if (this.isIndexedDBAvailable()) {
        await this.saveToIndexedDB(this.FILE_KEY, fileData);
      } else {
        const compressed = this.compressData(JSON.stringify(fileData));
        safeLocalStorage.setItem(this.FILE_KEY, compressed);
      }

      console.log("✅ File saved for persistence");
    } catch (error) {
      console.error("❌ Failed to save file:", error);
      throw error;
    }
  }

  async getStorageInfo(): Promise<StorageInfo> {
    if (!isBrowser()) {
      return { used: 0, available: this.MAX_STORAGE_SIZE, percentage: 0 };
    }

    try {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const available = estimate.quota || this.MAX_STORAGE_SIZE;
        return {
          used,
          available,
          percentage: (used / available) * 100,
        };
      } else {
        // Fallback for browsers without storage estimation
        const used = this.getLocalStorageSize();
        return {
          used,
          available: this.MAX_STORAGE_SIZE,
          percentage: (used / this.MAX_STORAGE_SIZE) * 100,
        };
      }
    } catch (error) {
      console.error("❌ Failed to get storage info:", error);
      return { used: 0, available: this.MAX_STORAGE_SIZE, percentage: 0 };
    }
  }

  private isIndexedDBAvailable(): boolean {
    return isBrowser() && "indexedDB" in window && indexedDB !== null;
  }

  private async saveToIndexedDB(key: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("TaskMasterDB", 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(["data"], "readwrite");
        const store = transaction.objectStore("data");

        const putRequest = store.put({ key, data, timestamp: Date.now() });
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("data")) {
          db.createObjectStore("data", { keyPath: "key" });
        }
      };
    });
  }

  private async restoreFromIndexedDB(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("TaskMasterDB", 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(["data"], "readonly");
        const store = transaction.objectStore("data");

        const getRequest = store.get(key);
        getRequest.onsuccess = () => {
          const result = getRequest.result;
          resolve(result ? result.data : null);
        };
        getRequest.onerror = () => reject(getRequest.error);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("data")) {
          db.createObjectStore("data", { keyPath: "key" });
        }
      };
    });
  }

  private async clearIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("TaskMasterDB", 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(["data"], "readwrite");
        const store = transaction.objectStore("data");

        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private compressData(data: string): string {
    // Simple compression using base64 - in production, use a real compression library
    return btoa(data);
  }

  private decompressData(compressed: string): string {
    return atob(compressed);
  }

  private calculateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private getLocalStorageSize(): number {
    if (!isBrowser()) return 0;

    let total = 0;
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
    } catch {
      // Silently handle any localStorage access errors
    }
    return total;
  }
}

export const persistenceManager = new PersistenceManager();
