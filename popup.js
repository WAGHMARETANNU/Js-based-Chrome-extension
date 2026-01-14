document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("timerInput");
    const startBtn = document.getElementById("startBtn");
    const message = document.getElementById("message");

    // Check remaining time on popup open
    chrome.runtime.sendMessage({ action: "getTimeLeft" }, (res) => {
        if (res.timeLeft > 0) {
            input.disabled = true;
            startBtn.disabled = true;
            message.textContent = `${res.timeLeft} minute(s) remaining ⏳`;
        } else {
            input.disabled = false;
            startBtn.disabled = false;
            message.textContent = "";
        }
    });

    startBtn.addEventListener("click", () => {
        const duration = parseInt(input.value);
        if (!isNaN(duration) && duration > 0) {
            chrome.runtime.sendMessage({ action: "startTimer", duration }, (res) => {
                if (res.status === "started") {
                    input.disabled = true;
                    startBtn.disabled = true;
                    message.textContent = `${duration} minute(s) remaining ⏳`;
                }
            });
        }
    });
});
