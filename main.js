// main.js
const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const ActivityManager = require('./ActivityManager.js');
const Notify = require('./Notify.js');

const isDevelopment = process.env.NODE_ENV !== 'production';
const csvPath = isDevelopment ? path.join(__dirname, 'resources', 'timetable.csv') : path.join(process.resourcesPath, 'timetable.csv');

let currentActivity = {
    "Activity": "Loading...",
    "Description": "",
    "Time Slot": "",
    "Motivational Quote": ""
};
let mainWindow = null; 


const activityManager = new ActivityManager(csvPath);
setInterval(() => {
    if (!mainWindow) {
        return;
    }
    activityManager.determineCurrentActivity()
    if(currentActivity !== activityManager.currentActivity && activityManager.currentActivity['Time Slot'] !== "") {
        mainWindow.webContents.send('activity-data', activityManager.currentActivity);
        var notify = new Notify("https://discord.com/api/webhooks/1166641316772450365/9n7WO67n2JweJ7uYz5hVYQFOWHp67fsldatnBoiymtZFxLx5En8HfuLPYAmEZ9uf1LbU");
        notify.sendNotification(activityManager.currentActivity);
    }
    currentActivity = activityManager.currentActivity;

        
}, 5*1000);



function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    if(mainWindow !== null) {
        return;
    }
    // Define the window size and position
    const windowWidth = 300;  // adjust as needed
    const windowHeight = 200; // adjust as needed
    const windowX = width - windowWidth;
    const windowY = height - windowHeight - 40;

    const win = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        x: windowX,
        y: windowY,
        frame: false,   // No window frame
        alwaysOnTop: true,  // Always on top of other windows
        transparent: true,
        resizable: false,   // Non-resizable window
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile('index.html');
    //win.setKiosk(true); // Set the window to kiosk mode
    mainWindow = win;
    win.webContents.on('did-finish-load', () => {
        win.webContents.send('activity-data', currentActivity);
    });

    win.on('closed', () => {
        mainWindow = null;
    });
    
}

app.on('ready', () => {
    if (!mainWindow) createWindow();
    app.setLoginItemSettings({
        openAtLogin: true,
        path: app.getPath('exe')
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});




