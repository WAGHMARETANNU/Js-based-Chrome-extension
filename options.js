document.addEventListener("DOMContentLoaded", async () => {
    let myChart = null;

    async function loadData() {
        const data = await chrome.storage.local.get(["settings", "stats"]);
        if (!data.settings) return;

        renderGroups(data.settings);
        setTimeout(() => {
            renderChart(data.stats || {}, data.settings);
        }, 100);
    }

    
    function renderGroups(settings) {
        const list = document.getElementById("groupList");
        list.innerHTML = "";
        
        for (const [name, config] of Object.entries(settings)) {
            const div = document.createElement("div");
            div.className = "group-item";
            div.style.borderLeft = `5px solid ${config.color}`;
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center">
                    <strong>${name}</strong>
                    <div>
                        <button class="edit-btn" data-name="${name}" style="width:auto; padding:5px 10px; background:#ffc107; color:black">Edit</button>
                        <button class="delete-group" data-name="${name}" style="width:auto; padding:5px 10px; background:#dc3545">Remove</button>
                    </div>
                </div>
                <div style="font-size:12px; color:#666; margin:5px 0">${config.urls.join(', ')}</div>
                <div style="font-size:11px; font-style:italic">"${config.msg}"</div>
            `;
            list.appendChild(div);
        }
    }

    
    function renderChart(stats, settings) {
        const canvas = document.getElementById('statsChart');
        if (!canvas) {
            console.error("Canvas element not found!");
            return;
        }
        
        const ctx = canvas.getContext('2d');
        const today = new Date().toISOString().split('T')[0];
        const dayData = stats[today] || {};
        
        const labels = Object.keys(settings);
        const values = labels.map(l => dayData[l] || 0);
        const colors = labels.map(l => settings[l].color || "#007bff");

        const hasData = values.some(v => v > 0);

        if (myChart) {
            myChart.destroy();
        }

        
        myChart = new Chart(ctx, {
            type: 'doughnut', 
            data: {
                labels: hasData ? labels : ["No Data Today"],
                datasets: [{
                    data: hasData ? values : [1],
                    backgroundColor: hasData ? colors : ["#eeeeee"],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    
    document.getElementById("saveBtn").addEventListener("click", async () => {
        const name = document.getElementById("groupName").value.trim();
        const limit = document.getElementById("groupLimit").value;
        const msg = document.getElementById("groupMsg").value.trim();
        const url = document.getElementById("urlInput").value.trim().toLowerCase();

        if (!name) return alert("Please enter a group name");

        const data = await chrome.storage.local.get("settings");
        if (!data.settings) data.settings = {};

        if (!data.settings[name]) {
            data.settings[name] = { urls: [], limit: limit, msg: msg, color: getRandomColor() };
        } else {
            data.settings[name].limit = limit;
            data.settings[name].msg = msg;
        }

        if (url && !data.settings[name].urls.includes(url)) {
            data.settings[name].urls.push(url);
        }

        await chrome.storage.local.set({ settings: data.settings });
        
        // Reset inputs
        document.getElementById("groupName").value = "";
        document.getElementById("urlInput").value = "";
        document.getElementById("groupMsg").value = "";
        
        loadData();
    });

    document.addEventListener("click", async (e) => {
        const data = await chrome.storage.local.get("settings");
        if (e.target.classList.contains("delete-group")) {
            const name = e.target.dataset.name;
            delete data.settings[name];
            await chrome.storage.local.set({ settings: data.settings });
            loadData();
        }
        if (e.target.classList.contains("edit-btn")) {
            const name = e.target.dataset.name;
            const config = data.settings[name];
            document.getElementById("groupName").value = name;
            document.getElementById("groupLimit").value = config.limit;
            document.getElementById("groupMsg").value = config.msg;
            window.scrollTo(0,0);
        }
    });

    function getRandomColor() {
        const colors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    loadData();
});