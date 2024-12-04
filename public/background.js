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

    // Step 1: Save current session cookies
    chrome.cookies.getAll({ url: origin }, (cookies) => {
      if (cookies.length > 0) {
        chrome.storage.local.set({ [`cookies_${origin}`]: cookies }, () => {
          console.log("Cookies saved for restoration:", origin);
        });
      }

      // Step 2: Proceed to clear session
      clearSession(origin, () => {
        sendResponse({ success: true, message: "Session cleared (cache, local storage, and cookies)." });
      });
    });

    return true; // Keep the message channel open for async response
  }

  /// For YOUTUBE

  /// Delete All Cookies for Relevant Domains

  function clearAllCookiesForYouTube() {
    const domains = ["https://www.youtube.com", "https://accounts.google.com"];
    domains.forEach((domain) => {
      chrome.cookies.getAll({ url: domain }, (cookies) => {
        cookies.forEach((cookie) => {
          chrome.cookies.remove({
            url: `${domain}${cookie.path}`,
            name: cookie.name,
          });
          console.log(`Removed cookie: ${cookie.name} for ${domain}`);
        });
      });
    });
  }

  /// Force Cache Clearing

  function clearCacheForYouTube() {
    const origins = ["https://www.youtube.com", "https://accounts.google.com"];
    chrome.browsingData.remove(
      { origins },
      { cache: true },
      () => console.log("Cache cleared for YouTube-related domains.")
    );
  }
  
  /// Further To prevent Google services to log back in 

  // function clearSessionDataAndOpenTab(origin, callback) {
  //   chrome.browsingData.remove(
  //     { origins: [origin] },
  //     { cookies: true, cache: true, localStorage: true },
  //     () => {
  //       console.log("Data cleared for:", origin);
  //       callback();
  //     }
  //   );
  // }

  function clearSessionDataAndOpenTab(origin,tabId, callback) {
    chrome.browsingData.remove(
      { origins: [origin] },
      { cookies: true, cache: true, localStorage: true },
      () => {
        console.log("Cookies, cache, and localStorage cleared for:", origin);
  
        // Explicitly clear IndexedDB
        chrome.scripting.executeScript(
          {
            target: { tabId: tabId },
            func: () => {
              indexedDB.databases().then((databases) =>
                databases.forEach((db) => indexedDB.deleteDatabase(db.name))
              );
              console.log("IndexedDB cleared.");
            },
          },
          () => {
            console.log("Session data cleared fully for:", origin);
            if (callback) callback();
          }
        );
      }
    );
  }


  function clearSessionAndOpenWithDelay(url,tabId, delay, callback) {
    console.log(`Clearing session and opening a tab with delay: ${delay}ms`);
    setTimeout(() => {
      // Clear session data (cookies, cache, localStorage, etc.)
      clearSessionDataAndOpenTab(url,tabId, () => {
        chrome.tabs.create({ url }, (newTab) => {
          console.log("New tab opened after delay:", newTab.id);
          if (callback) callback();
        });
      });
    }, delay);
  }


  function clearAndReload(tabId, origin, url) {
    clearSessionDataAndOpenTab(origin, async () => {
      try {
        await unregisterServiceWorker(tabId);
        console.log("Opening new tab...");
        chrome.tabs.create({ url });
      } catch (error) {
        console.error("Error during unregistration:", error);
      }
    });
  }

  // Step 3: Handle unregistration of Service Workers
  if (message.type === "UNREGISTER_SW") {
    const {tabId , url} = message;
    console.log("sender: " + sender)
    if (message.tabId) {
      console.log("Initiating Service Worker unregistration for tab:", message.tabId);
      chrome.scripting.executeScript(
        {
          target: { tabId: parseInt(message.tabId, 10) }, // Ensure tabId is an integer
          files: ["unregisterSW.js"], // Ensure this script is present in your extension
        },
        // () => {
        //   console.log("Service Worker unregistration script injected.");
        //   sendResponse({ success: true, message: "Service Worker unregistration initiated." });
        // }
        // Changes made to open another tab
        (results) => {
          if (chrome.runtime.lastError) {
            console.error("Error injecting script:", chrome.runtime.lastError.message);
            sendResponse({ success: false, message: "Failed to inject Service Worker unregistration script." });
          } else {
            
            console.log("Service Worker unregistration script injected:", results);
            // Add alert to notify the user
            // Alert doesn't work directly in your JS 
           //alert("Please wait while we clear your session and open the new tab...");

            // chrome.notifications.create({
            //   type: "basic",
            //   title: "Action in Progress",
            //   message: "Please wait while we clear the session and reopen the tab.",
            // });

            // Clear cookies, cache, and storage
            //      clearAllCookiesForYouTube();
            
            /// New implemented method because YouTube or other Google services keep logging back 
                // Add a delay for additional actions if required
            clearSessionAndOpenWithDelay(url, tabId, 3000, () => {
              console.log("Session cleared and tab opened with delay.");
            });
            //clearCacheForYouTube();
            // After unregistering SW, open a new tab with the same URL
            // chrome.tabs.create({ url }, (newTab) => {
            //   console.log("New tab opened with URL:", url);
            //   sendResponse({ success: true, message: "Service Worker cleanup initiated and new tab opened." });
            // });

                    // Step 2: Clear IndexedDB and Local Storage
                    
                    /** commented after implemented the clearSessionAndOpenWithDelay */

        /**      chrome.scripting.executeScript(
              {
                target: { tabId },
                func: () => {
                  window.localStorage.clear();
                  window.sessionStorage.clear();
                  indexedDB.databases().then((databases) =>
                    databases.forEach((db) => indexedDB.deleteDatabase(db.name))
                  );
                  console.log("Local storage and IndexedDB cleared.");
                },
              },
              () => {
                console.log("IndexedDB and Local Storage cleared.");

                // Step 3: Open a New Tab with the Same URL
                chrome.tabs.create({ url: message.url }, () => {
                  console.log("New tab opened with cleared session.");
                  sendResponse({
                    success: true,
                    message: "Session cleared and new tab opened.",
                  });
                });
              }
            ); */
          }
        }
      );
      return true;
    } else {
      console.error("Unable to determine sender tab for Service Worker unregistration.");
      sendResponse({ success: false, message: "Failed to initiate Service Worker cleanup." });
    }
  }
});

// Utility function to clear session
function clearSession(origin, callback) {
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

          callback(); // Final callback after clearing session
        });
      }
    );
  } catch (error) {
    console.error("Error during browsing data removal:", error);
    callback();
  }
}

// Step 4: Restore original cookies
function restoreCookies(origin) {
  console.log("Attempting to restore cookies for origin:", origin);
  chrome.storage.local.get(`cookies_${origin}`, (result) => {
    const savedCookies = result[`cookies_${origin}`];

    if (!savedCookies || savedCookies.length === 0) {
      console.log("No saved cookies found for:", origin);
      return;
    }

    console.log("Restoring cookies for:", origin, savedCookies);
    savedCookies.forEach((cookie) => {
      const cookieDetails = {
        url: origin,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        expirationDate: cookie.expirationDate,
      };
      chrome.cookies.set(cookieDetails, () => {
        console.log("Restored cookie:", cookie.name);
      });
    });
  });
}

// Step 5: Update Open Session to restore cookies
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "OPEN_SESSION") {
    const { url } = message;

    if (!url || !url.startsWith("http")) {
      sendResponse({ success: false, message: "Invalid URL provided for opening session." });
      return;
    }

    const origin = new URL(url).origin;

    // Open a new tab with the same URL
    chrome.tabs.create({ url }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error opening new tab:", chrome.runtime.lastError.message);
        sendResponse({ success: false, message: "Failed to open new session tab." });
        return;
      }
      console.log("New session tab opened for:", url);

      // Restore cookies for the original tab
      restoreCookies(origin);
      sendResponse({ success: true, message: "Session restored for original tab." });
    });

    return true; // Keep the message channel open for async response
  }
});
