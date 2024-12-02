document.getElementById("open-session").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];

    if (currentTab && currentTab.url) {
      chrome.runtime.sendMessage(
        {
          type: "CLEAR_SESSION",
          url: currentTab.url,
        },
        (response) => {
          if (response) {
            if (response.success) {
              console.log(response.message);
              // Open a new tab with the same URL
              chrome.tabs.create({ url: currentTab.url });
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
