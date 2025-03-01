// Initialize the QR code scanner
let html5QrcodeScanner;

function startScanner() {
  const qrScannerContainer = document.getElementById("qrScannerContainer");
  const messageElement = document.getElementById("message");

  console.log("Initializing QR code scanner...");

  // Configure the scanner
  html5QrcodeScanner = new Html5Qrcode("qrScannerContainer");

  // Start the camera
  html5QrcodeScanner.start(
    { facingMode: "environment" }, // Use the back camera
    { fps: 10, qrbox: 200 }, // Scanner configuration
    handleQrCodeScanned,
    handleError
  )
    .then(() => {
      console.log("QR code scanner started successfully.");
      messageElement.textContent = "Point your camera at the QR code to scan.";
    })
    .catch((error) => {
      console.error("Error starting QR code scanner:", error);
      messageElement.textContent = "Unable to start the QR code scanner. Please check your camera permissions.";
    });
}

// Function to handle QR code scanning
function handleQrCodeScanned(decodedText) {
  const messageElement = document.getElementById("message");

  try {
    console.log("Scanned QR Code Data:", decodedText);

    // Parse the JSON data from the QR code
    const jsonData = JSON.parse(decodedText);
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

// Function to handle errors during scanning
function handleError(error) {
  console.error("QR code scanner error:", error);
  const messageElement = document.getElementById("message");
  messageElement.textContent = "Error scanning QR code. Please ensure your camera is working and try again.";
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

// Start the QR code scanner when the page loads
window.addEventListener("load", () => {
  console.log("Page loaded. Attempting to start QR code scanner...");
  startScanner();
});
