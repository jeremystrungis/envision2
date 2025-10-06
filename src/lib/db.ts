// This file manages the connection to the local SQLite database via Electron's IPC.

// Declare a global interface for the Electron API exposed by the preload script
declare global {
  interface Window {
    electron: {
      db: {
        select: (query: string, params?: any[]) => Promise<any[]>;
        execute: (query: string, params?: any[]) => Promise<{ rowsAffected: number; lastInsertId: number }>;
      };
      dialog: {
        showSaveDialog: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;
      };
      fs: {
        writeFile: (filePath: string, content: string) => Promise<void>;
      };
    };
  }
}

let dbInstance: Window['electron']['db'] | null = null;

const loadDatabase = async (): Promise<Window['electron']['db']> => {
  if (dbInstance) {
    return dbInstance;
  }

  if (window.electron && window.electron.db) {
    dbInstance = window.electron.db;
    console.log("Electron IPC database connection established.");
    return dbInstance;
  } else {
    console.error("Electron IPC database API not available. Running outside Electron?");
    // Fallback or throw error if running outside Electron is not intended
    throw new Error("Electron IPC database API not available.");
  }
};

export const getDb = async () => {
  return await loadDatabase();
};

// The schema initialization is now handled in main.js, so this function is removed.
// export const initializeSchema = async () => { ... };
