document.addEventListener("DOMContentLoaded", async () => {
    const display = document.getElementById("display");
    const totalDisplay = document.getElementById("totalTime");
    const tabStatus = document.getElementById("currentTabStatus");

    async function updateUI() {
        const data = await chrome.storage.local.get(["settings", "stats"]);
        const today = new Date().toISOString().split('T')[0];
        const stats = data.stats?.[today] || {};
        
        if (!data.settings) return;

        display.innerHTML = ""; 
        let globalTotal = 0;

        for (const [cat, config] of Object.entries(data.settings)) {
            const spent = stats[cat] || 0;
            globalTotal += spent;
            const limit = parseInt(config.limit) || 1;
            const perc = Math.min(100, (spent / limit) * 100);
            
            display.innerHTML += `
                <div class="card">
                    <div style="display:flex; justify-content:space-between; font-size:13px">
                        <strong>${cat}</strong> 
                        <span>${spent} / ${limit} min</span>
                    </div>
                    <div class="bar"><div class="progress" style="width:${perc}%; background:${config.color}"></div></div>
                </div>`;
        }

        totalDisplay.textContent = globalTotal + " mins";

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
            try {
                const url = new URL(tab.url).hostname;
                let matched = false;
                for (const [cat, config] of Object.entries(data.settings)) {
                    if (config.urls.some(site => url.includes(site))) {
                        tabStatus.textContent = "Tracking: " + cat;
                        matched = true; break;
                    }
                }
                if (!matched) tabStatus.textContent = "Site not in a group";
            } catch(e) { tabStatus.textContent = "System Page"; }
        }
    }

    document.getElementById("openSettingsBtn").addEventListener("click", () => chrome.runtime.openOptionsPage());

    document.getElementById("resetBtn").addEventListener("click", async () => {
        if (confirm("Reset today's tracking?")) {
            const today = new Date().toISOString().split('T')[0];
            const data = await chrome.storage.local.get(null);
            
            if (data.stats && data.stats[today]) delete data.stats[today];
            
            for (const key in data) {
                if (key.startsWith(`notified_${today}`)) await chrome.storage.local.remove(key);
            }

            await chrome.storage.local.set({ stats: data.stats });
            updateUI();
        }
    });

    updateUI();
    setInterval(updateUI, 5000); 
});