const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://aj-law-firm.onrender.com' 
  : '';

export default API_BASE_URL;
