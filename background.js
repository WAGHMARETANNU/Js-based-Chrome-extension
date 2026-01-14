// background.js

// Start timer
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "startTimer") {
        const endTime = Date.now() + msg.duration * 60 * 1000;
        chrome.storage.local.set({ timerEnd: endTime }, () => {
            chrome.alarms.create("timerAlarm", { when: endTime });
            sendResponse({ status: "started" });
        });
        return true; // keeps message channel open
    }

    if (msg.action === "getTimeLeft") {
        chrome.storage.local.get("timerEnd", (data) => {
            const remaining = data.timerEnd ? Math.ceil((data.timerEnd - Date.now()) / 60000) : 0;
            sendResponse({ timeLeft: remaining });
        });
        return true;
    }
});

// Alarm listener
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "timerAlarm") {
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icon.png",
            title: "Timer Finished ⏰",
            message: "Time is up!"
        });
        chrome.storage.local.remove("timerEnd");
    }
});
