const { ipcRenderer } = require('electron');

ipcRenderer.on('activity-data', (event, data) => {
    console.log(data);
    document.getElementById('activity').textContent = data.Activity;
    document.getElementById('description').textContent = data.Description;
    document.getElementById('quote').textContent = data["Motivational Quote"];
});
