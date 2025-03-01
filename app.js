// Function to decode and process session data from the URL
function processSyncData() {
  const messageElement = document.getElementById("message");

  // Get the query parameter from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const encodedData = urlParams.get("data");

  if (!encodedData) {
    messageElement.textContent = "No session data found in the URL.";
    return;
  }

  try {
    // Decode the Base64 data and parse it as JSON
    const decodedData = atob(encodedData); // Base64 decode
    const jsonData = JSON.parse(decodedData);

    if (!jsonData.sessions || jsonData.sessions.length === 0) {
      messageElement.textContent = "No sessions found in the provided data.";
      return;
    }

    console.log("Decoded Session Data:", jsonData.sessions);
    messageElement.textContent = "Session data processed successfully!";

    // Create alarms for each session
    jsonData.sessions.forEach((session, index) => {
      const alarmTime = new Date(session.alarmTime);
      if (alarmTime < new Date()) {
        console.warn(`Skipping session ${session.sessionId} as its alarm time has already passed.`);
        return;
      }

      // Create a notification for the session
      createNotification(session.sessionId, session.projectName, alarmTime, session.sFlagLink);
    });
  } catch (error) {
    messageElement.textContent = "Invalid session data. Please try again.";
    console.error("Error decoding session data:", error.message);
  }
}

// Function to create a local notification
function createNotification(sessionId, projectName, alarmTime, sFlagLink) {
  const title = `${sessionId} - ${projectName}`;
  const options = {
    body: `Alarm set for ${alarmTime.toLocaleString()}`,
    icon: "icon.png", // Add an icon for the notification
    data: { url: sFlagLink }, // Pass the /s link as data
  };

  // Schedule the notification
  setTimeout(() => {
    if (Notification.permission === "granted") {
      const notification = new Notification(title, options);
      notification.onclick = () => {
        window.open(options.data.url, "_blank"); // Open the /s link when clicked
      };
    } else {
      console.warn("Notifications are not enabled on this device.");
    }
  }, alarmTime - new Date());
}

// Request notification permission on load
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

// Process sync data when the page loads
window.addEventListener("load", () => {
  console.log("Page loaded. Attempting to process sync data...");
  processSyncData();
});
