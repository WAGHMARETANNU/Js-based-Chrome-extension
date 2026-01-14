chrome.runtime.onInstalled.addListener(async () => {
    console.log("Extension Installed");
    const data = await chrome.storage.local.get("settings");
    if (!data.settings) {
        // Set default groups if none exist
        await chrome.storage.local.set({
            settings: {
                "Entertainment": { urls: ["youtube.com", "facebook.com"], limit: 30, color: "#ff4d4d", msg: "Limit reached!" },
                "Study": { urls: ["stackoverflow.com", "udemy.com"], limit: 60, color: "#4caf50", msg: "Keep up the good work!" }
            },
            stats: {}
        });
    }
    createAlarm();
});

// Ensure the alarm is created whenever the browser starts
chrome.runtime.onStartup.addListener(() => {
    createAlarm();
});

function createAlarm() {
    chrome.alarms.create("trackTime", { periodInMinutes: 1 });
    console.log("Alarm created for 1-minute intervals");
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "trackTime") {
        trackActiveTab();
    }
});

async function trackActiveTab() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0] || !tabs[0].url) return;

        const urlString = tabs[0].url;
        // Ignore internal chrome pages
        if (urlString.startsWith("chrome://") || urlString.startsWith("edge://")) return;

        const url = new URL(urlString).hostname;
        const data = await chrome.storage.local.get(["settings", "stats"]);
        const today = new Date().toISOString().split('T')[0];

        if (!data.settings) return;
        if (!data.stats) data.stats = {};
        if (!data.stats[today]) data.stats[today] = {};

        // Loop through your custom groups
        for (const [groupName, config] of Object.entries(data.settings)) {
            const isMatch = config.urls.some(site => url.includes(site));

            if (isMatch) {
                // Increment time spent
                data.stats[today][groupName] = (data.stats[today][groupName] || 0) + 1;
                const currentSpent = data.stats[today][groupName];
                const limit = parseInt(config.limit);

                console.log(`Tracking ${groupName}: ${currentSpent}/${limit} mins`);

                // Check for Limit
                if (currentSpent >= limit) {
                    const notifyKey = `notified_${today}_${groupName}`;
                    const res = await chrome.storage.local.get(notifyKey);
                    
                    if (!res[notifyKey]) {
                        triggerPopup(tabs[0].id, config.msg, config.color, groupName);
                        await chrome.storage.local.set({ [notifyKey]: true });
                    }
                }

                // Update Storage
                await chrome.storage.local.set({ stats: data.stats });
                break; // Stop loop once match is found
            }
        }
    } catch (error) {
        console.error("Tracking Error: ", error);
    }
}

function triggerPopup(tabId, msg, color, group) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (msg, color, group) => {
            // Check if popup already exists to prevent duplicates
            if (document.getElementById("tab-timer-modal-overlay")) return;

            const overlay = document.createElement('div');
            overlay.id = "tab-timer-modal-overlay";
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.8); z-index: 2147483647;
                display: flex; align-items: center; justify-content: center;
                backdrop-filter: blur(5px); font-family: sans-serif;
            `;

            const modal = document.createElement('div');
            modal.style.cssText = `
                background: white; padding: 40px; border-radius: 15px;
                max-width: 400px; width: 85%; text-align: center;
                box-shadow: 0 15px 30px rgba(0,0,0,0.5);
                border-top: 10px solid ${color};
            `;

            modal.innerHTML = `
                <h2 style="margin: 0 0 10px; color: #333; font-size: 26px;">${group} Alert</h2>
                <p style="font-size: 18px; color: #555; margin-bottom: 30px; line-height: 1.4;">${msg}</p>
                <button id="tab-timer-close-btn" style="
                    background: ${color}; color: white; border: none;
                    padding: 14px 0; border-radius: 8px; font-weight: bold;
                    cursor: pointer; font-size: 18px; width: 100%;
                ">OK, I'll stop</button>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            document.getElementById('tab-timer-close-btn').onclick = () => {
                overlay.remove();
            };
        },
        args: [msg || "Time is up!", color || "#007bff", group]
    }).catch(err => console.error("Script injection failed: ", err));
}