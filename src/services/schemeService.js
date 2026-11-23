import { schemes as localSchemes } from '../data/schemes';
import { ApiClient } from './apiClient';

// All 28 Indian states + UTs as a shared constant used across the app
export const ALL_INDIAN_STATES = [
  'All States',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Chandigarh',
  'Puducherry',
];

// Local fallback data service
async function fetchFromLocalData() {
  return Promise.resolve(localSchemes.map(item => ({ ...item })));
}

/**
 * Loads schemes from the Spring Boot backend REST endpoint (/api/schemes).
 * Falls back to local bundled schemes if the backend is offline.
 */
export async function getSchemesFromApi() {
  try {
    const data = await ApiClient.getSchemes();
    if (Array.isArray(data) && data.length > 0) {
      return data.map(s => ({
        ...s,
        // Convert semicolon-separated documents string into array for UI compatibility
        documents: Array.isArray(s.documents)
          ? s.documents
          : (typeof s.documents === 'string' && s.documents.length > 0
              ? s.documents.split(';').map(d => d.trim()).filter(Boolean)
              : []),
      }));
    }
  } catch (err) {
    console.warn('[JanSetu] Java backend unreachable (/api/schemes), using local catalogue fallback:', err.message);
  }
  return fetchFromLocalData();
}

// Keep backwards compatibility alias
export { getSchemesFromApi as getSchemesFromMockApi };
