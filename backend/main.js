const { app, BrowserWindow } = require("electron");

try {
  require("./dist/index.js");
} catch (error) {
  console.error(
    "⚠️ Error fatal al arrancar el backend dentro de Electron:",
    error,
  );
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL("http://localhost:3000");

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
