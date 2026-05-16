/**
 * Safely get jsPDF constructor.
 * Falls back to dynamically loading the CDN script if window.jspdf is not available.
 */
export async function getJsPDF() {
  // Already loaded via CDN script tag
  if (window.jspdf && window.jspdf.jsPDF) {
    return window.jspdf.jsPDF;
  }

  // Dynamic fallback — load from CDN
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      if (window.jspdf && window.jspdf.jsPDF) {
        resolve(window.jspdf.jsPDF);
      } else {
        reject(new Error('jsPDF failed to initialize'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load jsPDF library'));
    document.head.appendChild(script);
  });
}
