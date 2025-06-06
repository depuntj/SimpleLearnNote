export function formatDate(dateString) {
  try {
    if (!dateString) return 'Tanggal tidak valid';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Tanggal tidak valid';
    }

    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    };

    try {
      const formattedDate = date.toLocaleDateString('id-ID', options);

      if (diffDays === 1) {
        return `Kemarin, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffTime / (1000 * 60));

        if (diffHours < 1) {
          return diffMinutes < 1
            ? 'Baru saja'
            : `${diffMinutes} menit yang lalu`;
        } else if (diffHours < 24) {
          return `${diffHours} jam yang lalu`;
        }
      }

      return formattedDate;
    } catch (error) {
      console.error('Error formatting date:', error);
      return date.toISOString().split('T')[0];
    }
  } catch (error) {
    console.error('Error in formatDate:', error);
    return 'Tanggal tidak valid';
  }
}

let loadingTimeouts = new Set();

export function showLoading() {
  try {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.classList.remove('hidden');
      loadingIndicator.style.display = 'flex';
      loadingIndicator.style.opacity = '1';

      document.body.style.overflow = 'hidden';
    }
  } catch (error) {
    console.error('Error showing loading:', error);
  }
}

export function hideLoading() {
  try {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.opacity = '0';

      const timeoutId = setTimeout(() => {
        try {
          if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
            loadingIndicator.style.display = 'none';
            document.body.style.overflow = '';
          }
        } catch (error) {
          console.error('Error in hideLoading timeout:', error);
        } finally {
          loadingTimeouts.delete(timeoutId);
        }
      }, 200);

      loadingTimeouts.add(timeoutId);
    }
  } catch (error) {
    console.error('Error hiding loading:', error);
  }
}
let toastId = 0;
let activeToasts = new Map();

export function showToast(message, type = 'success', duration = 4000) {
  try {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      console.warn('Toast container not found');
      return;
    }
    if (activeToasts.size >= 5) {
      const oldestToast = activeToasts.keys().next().value;
      removeToast(oldestToast);
    }

    const currentToastId = ++toastId;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = `toast-${currentToastId}`;

    const sanitizedMessage = message
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const icon = getToastIcon(type);
    toast.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 10px; max-width: 100%;">
          <span style="font-size: 1.1em; margin-top: 1px; flex-shrink: 0;">${icon}</span>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; margin-bottom: 2px;">${getToastTitle(type)}</div>
            <div style="font-size: 0.9em; opacity: 0.9; word-wrap: break-word;">${sanitizedMessage}</div>
          </div>
          <button 
            style="background: none; border: none; font-size: 1.1em; cursor: pointer; color: inherit; opacity: 0.7; padding: 0; margin-left: 8px; flex-shrink: 0;"
            onclick="this.parentElement.parentElement.remove()"
            aria-label="Tutup notifikasi"
          >×</button>
        </div>
      `;

    toast.addEventListener('click', (event) => {
      if (event.target.tagName !== 'BUTTON') {
        removeToast(toast);
      }
    });

    toastContainer.appendChild(toast);
    activeToasts.set(toast, currentToastId);

    const timeoutId = setTimeout(() => {
      removeToast(toast);
    }, duration);

    toast.setAttribute('data-timeout', timeoutId);

    if ('vibrate' in navigator && type === 'error') {
      try {
        navigator.vibrate(100);
      } catch (error) {}
    }

    return currentToastId;
  } catch (error) {
    console.error('Error showing toast:', error);
    console.log(`Toast [${type}]: ${message}`);
  }
}

function getToastIcon(type) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };
  return icons[type] || icons.info;
}

function getToastTitle(type) {
  const titles = {
    success: 'Berhasil',
    error: 'Terjadi Kesalahan',
    warning: 'Peringatan',
    info: 'Informasi',
  };
  return titles[type] || titles.info;
}

function removeToast(toast) {
  try {
    if (toast && toast.parentNode) {
      const timeoutId = toast.getAttribute('data-timeout');
      if (timeoutId) {
        clearTimeout(parseInt(timeoutId));
      }

      activeToasts.delete(toast);

      toast.classList.add('removing');

      const removeTimeoutId = setTimeout(() => {
        try {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        } catch (error) {
          console.error('Error removing toast:', error);
        }
      }, 300);

      setTimeout(() => clearTimeout(removeTimeoutId), 350);
    }
  } catch (error) {
    console.error('Error in removeToast:', error);
  }
}

export function debounce(func, wait, immediate = false) {
  let timeout;
  let isDestroyed = false;

  const debouncedFunction = function executedFunction(...args) {
    if (isDestroyed) return;

    const later = () => {
      timeout = null;
      if (!immediate && !isDestroyed) {
        try {
          func(...args);
        } catch (error) {
          console.error('Error in debounced function:', error);
        }
      }
    };

    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow && !isDestroyed) {
      try {
        func(...args);
      } catch (error) {
        console.error('Error in immediate debounced function:', error);
      }
    }
  };

  debouncedFunction.cancel = () => {
    isDestroyed = true;
    clearTimeout(timeout);
    timeout = null;
  };

  return debouncedFunction;
}

export function throttle(func, limit) {
  let inThrottle;
  let isDestroyed = false;

  const throttledFunction = function (...args) {
    if (isDestroyed) return;

    if (!inThrottle) {
      try {
        func.apply(this, args);
      } catch (error) {
        console.error('Error in throttled function:', error);
      }
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };

  throttledFunction.cancel = () => {
    isDestroyed = true;
    inThrottle = false;
  };

  return throttledFunction;
}

export const storage = {
  set(key, value) {
    try {
      if (typeof key !== 'string' || key.length === 0) {
        console.warn('Invalid storage key:', key);
        return false;
      }

      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
      return false;
    }
  },

  get(key, defaultValue = null) {
    try {
      if (typeof key !== 'string' || key.length === 0) {
        console.warn('Invalid storage key:', key);
        return defaultValue;
      }

      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return defaultValue;
    }
  },

  remove(key) {
    try {
      if (typeof key !== 'string' || key.length === 0) {
        console.warn('Invalid storage key:', key);
        return false;
      }

      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      return false;
    }
  },
};

export function isOnline() {
  try {
    return navigator.onLine;
  } catch (error) {
    console.error('Error checking online status:', error);
    return true;
  }
}

export function smoothScrollTo(element, options = {}) {
  try {
    if (!element) {
      console.warn('Element not provided for smooth scroll');
      return;
    }

    const defaultOptions = {
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    };

    if (element.scrollIntoView) {
      element.scrollIntoView({ ...defaultOptions, ...options });
    }
  } catch (error) {
    console.error('Error in smooth scroll:', error);
  }
}

export async function copyToClipboard(text) {
  try {
    if (!text || typeof text !== 'string') {
      showToast('❌ Tidak ada teks untuk disalin', 'error');
      return false;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      showToast('📋 Teks berhasil disalin ke clipboard', 'success', 2000);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.cssText = `
          position: fixed;
          opacity: 0;
          left: -9999px;
          top: -9999px;
          pointer-events: none;
        `;

      document.body.appendChild(textArea);
      textArea.select();
      textArea.setSelectionRange(0, 99999);

      const success = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (success) {
        showToast('📋 Teks berhasil disalin ke clipboard', 'success', 2000);
      } else {
        showToast('❌ Gagal menyalin teks ke clipboard', 'error');
      }

      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    showToast('❌ Gagal menyalin teks ke clipboard', 'error');
    return false;
  }
}

export function truncateText(text, maxLength = 100) {
  try {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  } catch (error) {
    console.error('Error truncating text:', error);
    return text || '';
  }
}

export function escapeHtml(text) {
  try {
    if (!text || typeof text !== 'string') return '';

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  } catch (error) {
    console.error('Error escaping HTML:', error);
    return text || '';
  }
}

export function measurePerformance(name, fn) {
  return async function (...args) {
    const start = performance.now();
    try {
      const result = await fn.apply(this, args);
      const end = performance.now();
      console.log(`${name} took ${Math.round(end - start)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.log(`${name} failed after ${Math.round(end - start)}ms`);
      throw error;
    }
  };
}

export function cleanup() {
  try {
    loadingTimeouts.forEach((id) => clearTimeout(id));
    loadingTimeouts.clear();
    activeToasts.forEach((id, toast) => {
      removeToast(toast);
    });
    activeToasts.clear();

    console.log('Utils cleanup completed');
  } catch (error) {
    console.error('Error during utils cleanup:', error);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
}
