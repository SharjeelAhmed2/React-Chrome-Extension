chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CLEAR_SESSION") {
    const { url } = message;

    if (!url || !url.startsWith("http")) {
      console.error("Invalid URL:", url);
      sendResponse({ success: false, message: "Invalid URL provided." });
      return;
    }

    const origin = new URL(url).origin;
    console.log("Attempting to clear browsing data for:", origin);

    try {
      // Clear cache and local storage
      chrome.browsingData.remove(
        { origins: [origin] },
        { cache: true, localStorage: true },
        () => {
          console.log("Cache and local storage cleared for:", origin);

          // Clear cookies
          chrome.cookies.getAll({ url: origin }, (cookies) => {
            if (cookies.length === 0) {
              console.log("No cookies found for:", origin);
            } else {
              cookies.forEach((cookie) => {
                chrome.cookies.remove({ url: `${origin}${cookie.path}`, name: cookie.name }, () => {
                  console.log("Removed cookie:", cookie.name);
                });
              });
            }

            // Final response back to the popup.js
            sendResponse({ success: true, message: "Session cleared (cache, local storage, and cookies)." });
          });
        }
      );
    } catch (error) {
      console.error("Error during browsing data removal:", error);
      sendResponse({ success: false, message: "Failed to clear session data." });
    }

    return true; // Keep the message channel open for async response
  }
});
