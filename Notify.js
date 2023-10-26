const axios = require('axios');

class Notify {
    constructor(webhookURL) {
        this.webhookURL = webhookURL;
    }

    async sendNotification(activity) {

        const content = `It's time for your **${activity.Activity}**! Dive into **${activity.Description}**. Remember: ${activity["Motivational Quote"]}. Set your pace and make the most of it!`;
        
        try {
            const response = await axios.post(this.webhookURL, {
                content: content
            });
            return response.data;
        } catch (error) {
            console.error("Failed to send notification:", error);
            throw error;
        }
    }
}

module.exports = Notify;