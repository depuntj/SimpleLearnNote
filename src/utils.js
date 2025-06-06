export function formatDate(dateString) {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

export function showLoading() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.classList.remove('hidden');
  }
}

export function hideLoading() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.classList.add('hidden');
  }
}

export function showToast(message, type = 'success', duration = 3000) {
  const toastContainer = document.getElementById('toast-container');

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('removing');
      setTimeout(() => {
        if (toast.parentNode) {
          toastContainer.removeChild(toast);
        }
      }, 300);
    }
  }, duration);
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
