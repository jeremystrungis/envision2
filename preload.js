const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  db: {
    select: (query, params) => ipcRenderer.invoke('db-select', query, params),
    execute: (query, params) => ipcRenderer.invoke('db-execute', query, params),
  },
  // Add other APIs here if needed, e.g., for file dialogs
});
