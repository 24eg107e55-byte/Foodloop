// FoodLoop API Base URL Configuration
// In production (Netlify), configure VITE_API_BASE_URL with your Render backend URL (e.g., https://foodloop-backend.onrender.com)
// In local development, defaults to http://localhost:8080

const envBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL = envBaseUrl
    ? envBaseUrl.trim().replace(/\/+$/, '')
    : 'http://localhost:8080';

export default API_BASE_URL;
