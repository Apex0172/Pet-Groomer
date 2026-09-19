/**
 * Multi-Tenant SaaS Firestore Schema
 * 
 * Collections:
 * - businesses: The groomer/owner details. ID = auth.uid
 * - services: The grooming services offered.
 * - clients: The pet owners.
 *   - pets: Subcollection under clients for the client's pets.
 * - appointments: The booking records.
 */

/**
 * @typedef {Object} Business
 * @property {string} businessName - e.g. "Paws & Bubbles Mobile Grooming"
 * @property {string} ownerName
 * @property {string} email
 * @property {string} phone
 * @property {Object} branding - e.g. { logoUrl: string, primaryColor: string }
 * @property {string} createdAt - ISO string
 */

/**
 * @typedef {Object} Service
 * @property {string} businessId - Reference to the Business
 * @property {string} serviceName - e.g. "Full Groom"
 * @property {string} petSize - 'Small', 'Medium', 'Large', 'Any'
 * @property {number} durationMinutes - e.g. 60
 * @property {number} price
 */

/**
 * @typedef {Object} Client
 * @property {string} businessId - Reference to the Business
 * @property {string} ownerName
 * @property {string} phone
 * @property {string} email
 * @property {string} createdAt - ISO string
 */

/**
 * @typedef {Object} Pet
 * @property {string} petName
 * @property {string} breed
 * @property {number} weight
 * @property {string} temperament - 'Friendly', 'Anxious', 'Aggressive'
 * @property {string} vaccineExpiryDate - ISO string
 * @property {string} rabiesVaccineUrl - Firebase Storage URL
 * @property {string} notes
 */

/**
 * @typedef {Object} Appointment
 * @property {string} businessId - Reference to the Business
 * @property {string} clientId - Reference to the Client
 * @property {string} petId - Reference to the Pet (inside Client subcollection)
 * @property {string} serviceId - Reference to the Service
 * @property {string} startTime - ISO string
 * @property {string} endTime - ISO string (includes 30-min travel buffer)
 * @property {string} status - 'Pending', 'Confirmed', 'Completed', 'Rejected'
 * @property {string[]} beforeAfterPhotos - Array of Firebase Storage URLs
 * @property {string} createdAt - ISO string
 */

export {};
