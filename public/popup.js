// Event listener for "Open Session" button
document.getElementById("open-session").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];

    if (currentTab && currentTab.url) {
      // First clear the session
      chrome.runtime.sendMessage(
        {
          type: "CLEAR_SESSION",
          url: currentTab.url,
        },
        (response) => {
          if (response) {
            if (response.success) {
              console.log(response.message);

              // After clearing the session, send the OPEN_SESSION message
              chrome.runtime.sendMessage(
                {
                  type: "OPEN_SESSION",
                  url: currentTab.url,
                },
                (openSessionResponse) => {
                  if (openSessionResponse && openSessionResponse.success) {
                    console.log(openSessionResponse.message);
                  } else {
                    console.error(openSessionResponse?.message || "Failed to open session.");
                  }
                }
              );
            } else {
              console.error(response.message);
              alert(response.message);
            }
          } else {
            console.error("No response received from background script.");
            alert("An error occurred. Please try again.");
          }
        }
      );
    } else {
      alert("Unable to retrieve the current tab's URL.");
    }
  });
});

// Event listener for "Unregister Service Workers" button
document.getElementById("unregister-sw").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];

    if (currentTab && currentTab.id) {
      chrome.runtime.sendMessage(
        { type: "UNREGISTER_SW", 
          tabId: currentTab.id,  
          url: currentTab.url, // Include the current tab's URL
        },
        (response) => {
          if (response && response.success) {
            console.log(response.message);
          //  alert("Service Worker cleanup initiated!");
          } else {
            console.error("Service Worker cleanup failed:", response?.message || "Unknown error.");
            alert("Failed to cleanup Service Workers.");
          }
        }
      );
    } else {
      alert("Unable to retrieve the active tab for Service Worker unregistration.");
    }
  });
});
