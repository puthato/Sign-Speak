// This optional service worker helps load the app faster.
const register = () => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(
          (registration) => {
            console.log('Service Worker registered:', registration);
          },
          (error) => {
            console.error('Service Worker registration failed:', error);
          }
        );
      });
    }
  };
  
  export default register;
  