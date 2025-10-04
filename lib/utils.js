/**
 * Format currency to Indonesian Rupiah
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to Indonesian locale
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Format date to short format (DD/MM/YYYY)
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDateShort(date) {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

/**
 * Generate random ID
 * @param {number} length - Length of the ID
 * @returns {string} Random ID
 */
export function generateId(length = 8) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length)
    .toUpperCase();
}

/**
 * Calculate total price with discount
 * @param {number} price - Base price
 * @param {number} quantity - Quantity
 * @param {number} discount - Discount amount
 * @returns {number} Total price
 */
export function calculateTotalPrice(price, quantity, discount = 0) {
  return price * quantity - discount;
}

/**
 * Get status badge color
 * @param {string} status - Project status
 * @returns {string} CSS class name
 */
export function getStatusColor(status) {
  const statusColors = {
    "to do": "status-todo",
    "in progress": "status-progress",
    "waiting for payment": "status-waiting",
    "in review": "status-review",
    revision: "status-revision",
    done: "status-completed",
  };
  return statusColors[status] || "status-default";
}

/**
 * Truncate text
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, length = 50) {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export function isValidEmail(email) {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Indonesian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Is valid phone number
 */
export function isValidPhone(phone) {
  const phoneRegex = /^62[0-9]{9,12}$/;
  return phoneRegex.test(phone);
}

/**
 * Format phone number for WhatsApp
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export function formatWhatsAppNumber(phone) {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, "");

  // If starts with 0, replace with 62
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }

  // If doesn't start with 62, add it
  if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }

  return cleaned;
}
