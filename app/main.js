/*
Autistic Code Ahead!
*/

const { app, BrowserWindowm, autoUpdater } = require('electron')
const path = require('path')
//const server = 'https://athena-updater-first-m1gtoyjcd-rxn69.vercel.app/' 
//const url = `${server}/update/${process.platform}/${app.getVersion()}` 
autoUpdater.setFeedURL({ url })

const UPDATE_CHECK_INTERVAL = 10 * 60 * 1000

setInterval(() => {
  autoUpdater.checkForUpdates()
}, UPDATE_CHECK_INTERVAL)

var mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    icon: path.join(__dirname, 'assets', 'logo.png'),
    frame: false,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: true,
      enableRemoteModule: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'scripts', 'preload.js')
    }
  })

  mainWindow.loadFile('app/index.html')
}

app.whenReady().then(() => {
    createWindow()

    ipcMain.on("minimize", (e) => {
        mainWindow?.minimize();
    });

    ipcMain.on("close", (e) => {
        mainWindow?.close();
    });
})

app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow()
});

app.on('ready', function()  {
});

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Athena Launcher Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail: 'Updates have been downloaded and are ready to be applied. Restart the application to apply the updates.'
  }
dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall()
  })
})