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