contextBridge.exposeInMainWorld("electron", {
    ipcRenderer: {
      sendMessage(channel, args) {
        ipcRenderer.send(channel, args);
      },
    },
});