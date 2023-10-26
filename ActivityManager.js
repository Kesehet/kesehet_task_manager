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
            const csvData = response.data.replaceAll('"""',"");
            console.log(csvData);
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
        const current = this.toMinutes(now.getHours(), now.getMinutes());

        for (let row of this.activities) {
            let timeSlot = row["Time Slot"];
            if (!timeSlot) {
                console.error("Invalid Time Slot:", timeSlot);
                continue;  // skip to next iteration if time slot is invalid
            }

            let [start, end] = timeSlot.split(/\s*-\s*/).map((time, index) => {
                let parsedTime = this.parseTime(time);
                if (!parsedTime) {
                    console.error(`Invalid time format at index ${index}:`, time);
                    return null;
                }
                return {
                    "inMins": this.toMinutes(parsedTime.hours, parsedTime.minutes),
                    "hours": parsedTime.hours,
                    "minutes": parsedTime.minutes,
                    "row": row
                };
            });

            if (!start || !end) continue;  // skip to next iteration if start or end time is invalid

            if (this.isTimeBetween(current, start.inMins, end.inMins)) {
                potentialActivity = row;
                break;  // break once you find the current activity
            }
        }

        if (potentialActivity["Activity"] !== "Loading...") {
            this.currentActivity = potentialActivity;
        }

        return potentialActivity;
    }

    // Helper function to parse time and convert it to 24-hour format
    parseTime(time) {
        time = time.trim().toLowerCase();
        let plus12 = time.includes('pm');
        time = time.replace(/am|pm/g, '');
        let [hourStr, minuteStr] = time.split(':');
        let hour = parseInt(hourStr);
        let minute = parseInt(minuteStr);

        if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 12 || minute < 0 || minute > 59) {
            return null;  // return null for invalid time
        }

        hour = hour % 12 + (plus12 ? 12 : 0);  // Convert to 24-hour format
        return { hours: hour, minutes: minute };
    }

}

module.exports = ActivityManager;
