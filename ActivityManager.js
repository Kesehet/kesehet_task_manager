const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');

class ActivityManager {
    constructor(csvPath) {
        this.csvPath = csvPath;
        this.activities = [];
        this.currentActivity = {
            "Activity": "Loading...",
            "Description": "",
            "Time Slot": "",
            "Motivational Quote": ""
        };
        this.readCSV(() => {
            this.determineCurrentActivity();
        })
    }

    toMinutes(hour, minute) {
        return (parseInt(hour) * 60) + parseInt(minute);
    }

    isTimeBetween(current, start, end) {
        return current >= start && current <= end;
    }

    
    async readCSV(callback) {
        this.activities = [];

        try {
            const response = await axios.get(this.csvPath, { responseType: 'text' });
            const csvData = response.data;
            const lines = csvData.split('\n');
            const headers = lines[0].split(',');

            for (let i = 1; i < lines.length; i++) {
                const data = lines[i].split(',');
                const obj = {};
                for (let j = 0; j < data.length; j++) {
                    obj[headers[j]] = data[j];
                }
                this.activities.push(obj);
            }

            if (callback) {
                callback();
            }
        } catch (error) {
            console.error('Error fetching or parsing CSV:', error);
            if (callback) {
                callback(error);
            }
        }
    }

    determineCurrentActivity() {
        let potentialActivity = {
            "Activity": "Loading...",
            "Description": "",
            "Time Slot": "",
            "Motivational Quote": ""
        };

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const current = this.toMinutes(currentHour, currentMinute);

        for (let row of this.activities) {
            let [start, end] = row["Time Slot"].split(/\s*-\s*/).map((time) => {
                let plus12 = false;
                time = time.trim();
                if (time.includes('pm')) {
                    plus12 = true;
                }
                time = time.replace(/am|pm/g, '');
                let [hour, minute] = time.split(':');
                hour = parseInt(hour) + (plus12 && (hour < 12) ? 12 : 0);
                return {
                    "inMins": this.toMinutes(hour, minute),
                    "hours": hour,
                    "minutes": minute,
                    "row": row
                };
            });
            if (this.isTimeBetween(current, start.inMins, end.inMins)) {
                potentialActivity = row;
                break;  // break once you find the current activity
            }
        }

        if (potentialActivity) {
            this.currentActivity = potentialActivity;
        }

        return potentialActivity;
    }
}

module.exports = ActivityManager;
