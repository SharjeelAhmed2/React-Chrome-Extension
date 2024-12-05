// Unregister all active Service Workers for the current page
// navigator.serviceWorker.getRegistrations().then((registrations) => {
//     registrations.forEach((registration) => {
//       registration.unregister().then((success) => {
//         if (success) {
//           console.log("Service Worker unregistered:", registration.scope);
//         } else {
//           console.warn("Failed to unregister Service Worker:", registration.scope);
//         }
//       });
//     });
//   });
  
navigator.serviceWorker.getRegistrations().then((registrations) => {
  registrations.forEach((registration) => registration.unregister());
  console.log("All Service Workers unregistered.");
});

// Clear sessionStorage
window.sessionStorage.clear();
console.log("Session Storage cleared.");

// Clear localStorage for safety
window.localStorage.clear();
console.log("Local Storage cleared.");

if ('sharedStorage' in window) {
  window.sharedStorage.clear(); // Hypothetical API—ensure compatibility
  console.log("Shared Storage cleared.");
}
