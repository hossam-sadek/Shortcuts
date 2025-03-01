// Function to handle QR code scanning
function handleQrCodeScanned(event) {
  const qrData = event.detail;
  const messageElement = document.getElementById("message");

  try {
    // Parse the JSON data from the QR code
    const jsonData = JSON.parse(qrData);
    if (!jsonData.sessions || jsonData.sessions.length === 0) {
      messageElement.textContent = "No sessions found in the QR code.";
      return;
    }

    // Display the decoded session data
    messageElement.textContent = "Decoded session data successfully!";
    console.log("Decoded Session Data:", jsonData.sessions);

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
    messageElement.textContent = "Invalid QR code data. Please try again.";
    console.error("Error decoding QR code data:", error.message);
  }
}

// Function to create a local notification (for testing purposes)
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