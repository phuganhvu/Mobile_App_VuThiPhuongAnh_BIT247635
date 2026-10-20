export const BASE_URL =
  process.env.EXPO_PUBLIC_MOCKAPI_BASE_URL || 'https://6acde9adf338359cf1c29dbd.mockapi.io';

export const ENDPOINTS = {
  categories: `${BASE_URL}/Categories`,
  courses: `${BASE_URL}/Courses`,
};

export const assertApiConfigured = () => {
  if (BASE_URL.includes('YOUR_PROJECT_ID')) {
    throw new Error(
      'Chưa cấu hình MockAPI. Hãy đặt EXPO_PUBLIC_MOCKAPI_BASE_URL trong file .env hoặc cập nhật src/config/api.js bằng URL project của bạn.'
    );
  }
};
