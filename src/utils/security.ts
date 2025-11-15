export const sanitizeInput = (input: string): string => {
  if (!input) return '';

  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  return email.toLowerCase().trim();
};

export const sanitizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/[^\d+\-() ]/g, '').trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\d+\-() ]{7,20}$/;
  return phoneRegex.test(phone);
};

export const maskSensitiveData = (data: string, visibleChars: number = 4): string => {
  if (!data || data.length <= visibleChars) return '****';
  return '*'.repeat(data.length - visibleChars) + data.slice(-visibleChars);
};

export const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const isSecureContext = (): boolean => {
  return window.isSecureContext;
};

export const enforceHttps = (): void => {
  if (import.meta.env.PROD && window.location.protocol !== 'https:') {
    window.location.href = window.location.href.replace('http:', 'https:');
  }
};

export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key] as string) as T[Extract<keyof T, string>];
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }

  return sanitized;
};

export const rateLimiter = (() => {
  const attempts: Map<string, { count: number; timestamp: number }> = new Map();

  return {
    check: (key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean => {
      const now = Date.now();
      const record = attempts.get(key);

      if (!record || now - record.timestamp > windowMs) {
        attempts.set(key, { count: 1, timestamp: now });
        return true;
      }

      if (record.count >= maxAttempts) {
        return false;
      }

      record.count++;
      return true;
    },
    reset: (key: string): void => {
      attempts.delete(key);
    }
  };
})();

export const secureStorage = {
  setItem: (key: string, value: string): void => {
    try {
      const encrypted = btoa(value);
      sessionStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Storage error:', error);
    }
  },

  getItem: (key: string): string | null => {
    try {
      const encrypted = sessionStorage.getItem(key);
      return encrypted ? atob(encrypted) : null;
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  },

  removeItem: (key: string): void => {
    sessionStorage.removeItem(key);
  },

  clear: (): void => {
    sessionStorage.clear();
  }
};
