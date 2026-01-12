let startTime;
let reminderMs;
let timerInterval;

// Get DOM elements
const startBtn = document.getElementById("startBtn");
const minutesInput = document.getElementById("minutes");
const timeElement = document.getElementById("time");

// Function to start the timer
function startTimer() {
    const minutes = parseFloat(minutesInput.value); // get user input
    if (isNaN(minutes) || minutes <= 0) {
        alert("Please enter a valid number of minutes!");
        return;
    }

    reminderMs = minutes * 60 * 1000; // convert minutes to milliseconds
    startTime = Date.now(); // track start time

    // Clear previous timer if exists
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const elapsedSeconds = Math.floor(elapsed / 1000);
        timeElement.textContent = elapsedSeconds;

        // Reminder check
        if (elapsed >= reminderMs) {
            alert(`⏰ ${minutes} minute(s) are up! Time to take a break.`);
            startTime = Date.now(); // reset timer
        }
    }, 1000);
}

// Event listener for button
startBtn.addEventListener("click", startTimer);
