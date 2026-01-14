//content.js
// Track when the page was opened
let startTime = Date.now(); 

// Reminder interval in minutes (change this to your preferred time)
const reminderMinutes = 0.1; // 0.1 min = 6 seconds (for testing)
const reminderMs = reminderMinutes * 60 * 1000; // convert to milliseconds

// Check every second if it's time for a reminder
setInterval(() => {
    const elapsed = Date.now() - startTime; // time passed in ms

    if (elapsed >= reminderMs) {
        alert("⏰ Time to take a break or refocus!"); // simple popup reminder
        startTime = Date.now(); // reset timer for next reminder
    }
}, 1000);
