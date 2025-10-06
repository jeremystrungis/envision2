const { app, BrowserWindow, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const Database = require('better-sqlite3'); // Import better-sqlite3

let mainWindow;
let db; // Declare a variable for the database connection

// Function to initialize the SQLite database
function initializeDatabase() {
    const dbPath = path.join(app.getPath('userData'), 'appdata.db');
    db = new Database(dbPath);
    console.log(`Database initialized at: ${dbPath}`);

    // Create tables if they don't exist
    db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            startDate TEXT,
            endDate TEXT,
            status TEXT
        );
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            projectId INTEGER NOT NULL,
            assignments TEXT, -- Stored as JSON string
            startDate TEXT,
            endDate TEXT,
            dependencies TEXT, -- Stored as JSON string
            hours INTEGER,
            status TEXT,
            FOREIGN KEY (projectId) REFERENCES projects(id)
        );
        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            authUid TEXT,
            name TEXT NOT NULL,
            teams TEXT, -- Stored as JSON string
            avatar TEXT,
            capacity INTEGER
        );
    `);
    console.log("Database schema checked/initialized.");
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false, // Set to false for security
            contextIsolation: true, // Set to true for security
            preload: path.join(__dirname, 'preload.js') // Path to your preload script
        }
    });

    const startUrl = isDev 
        ? 'http://localhost:9002' // Your Next.js development server port
        : `file://${path.join(__dirname, 'out/index.html')}`;

    mainWindow.loadURL(startUrl);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    initializeDatabase(); // Initialize database when app is ready
    createWindow();

    // IPC handler for SELECT queries
    ipcMain.handle('db-select', (event, query, params) => {
        try {
            const stmt = db.prepare(query);
            return stmt.all(params);
        } catch (error) {
            console.error('db-select error:', error);
            throw error;
        }
    });

    // IPC handler for INSERT, UPDATE, DELETE queries
    ipcMain.handle('db-execute', (event, query, params) => {
        try {
            const stmt = db.prepare(query);
            const result = stmt.run(params);
            return { rowsAffected: result.changes, lastInsertId: result.lastInsertRowid };
        } catch (error) {
            console.error('db-execute error:', error);
            throw error;
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        db.close(); // Close the database connection when all windows are closed
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
