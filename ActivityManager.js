const fs = require('fs');
const csv = require('csv-parser');

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

    readCSV(callback) {
        this.activities = [];

        fs.createReadStream(this.csvPath)
            .pipe(csv())
            .on('data', (row) => {
                this.activities.push(row);
            })
            .on('end', () => {
                if (callback) {
                    callback();
                }
            });
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
