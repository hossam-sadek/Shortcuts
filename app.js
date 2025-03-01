// Initialize the QR code scanner
let html5QrcodeScanner;

// Function to check and request camera access
async function checkCameraAccess() {
  const messageElement = document.getElementById("message");

  try {
    // Request camera access
    await navigator.mediaDevices.getUserMedia({ video: true });
    console.log("Camera access granted.");
    return true;
  } catch (error) {
    console.error("Camera access denied:", error.message);
    messageElement.textContent = "Camera access denied. Please grant camera permissions.";
    return false;
  }
}

// Function to start the QR code scanner
function startScanner() {
  const qrScannerContainer = document.getElementById("qrScannerContainer");
  const messageElement = document.getElementById("message");

  console.log("Attempting to start the camera...");

  // Clean up any existing scanner
  if (html5QrcodeScanner) {
    html5QrcodeScanner.stop().then(() => {
      console.log("Existing QR code scanner stopped.");
    }).catch((error) => {
      console.error("Error stopping existing QR code scanner:", error);
    });
  }

  // Initialize the scanner
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
      document.getElementById("startCameraButton").style.display = "none"; // Hide the start button
    })
    .catch((error) => {
      console.error("Error starting QR code scanner:", error);
      messageElement.textContent = "Unable to start the QR code scanner. Please use the manual input below.";
      showManualInput();
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
  messageElement.textContent = "Error scanning QR code. Please try again or use the manual input below.";
  showManualInput();
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

// Show the manual input container
function showManualInput() {
  const manualInputContainer = document.getElementById("manualInputContainer");
  manualInputContainer.style.display = "block";

  // Handle manual input submission
  document.getElementById("submitManualInput").addEventListener("click", () => {
    const manualInput = document.getElementById("manualInput").value.trim();
    if (!manualInput) {
      alert("Please enter valid JSON data.");
      return;
    }

    try {
      const jsonData = JSON.parse(manualInput);
      if (!jsonData.sessions || jsonData.sessions.length === 0) {
        alert("No sessions found in the provided JSON data.");
        return;
      }

      console.log("Manually entered session data:", jsonData.sessions);
      document.getElementById("message").textContent = "Manually entered session data processed successfully!";

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
      alert("Invalid JSON data. Please try again.");
      console.error("Error parsing manually entered JSON data:", error.message);
    }
  });
}

// Start the QR code scanner when the "Start Camera" button is clicked
document.getElementById("startCameraButton").addEventListener("click", async () => {
  const messageElement = document.getElementById("message");
  messageElement.textContent = "Attempting to start the camera...";

  // Check camera access
  if (!await checkCameraAccess()) {
    messageElement.textContent = "Camera access denied. Please grant camera permissions.";
    return;
  }

  // Start the scanner
  startScanner();
});

// Optionally, attempt to start the scanner automatically on page load
window.addEventListener("load", async () => {
  console.log("Page loaded. Attempting to start QR code scanner...");
  if (await checkCameraAccess()) {
    startScanner();
  }
});
