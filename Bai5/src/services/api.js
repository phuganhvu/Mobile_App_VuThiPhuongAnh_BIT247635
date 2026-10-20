import { assertApiConfigured, ENDPOINTS } from '../config/api';

const request = async (url, options = {}) => {
  assertApiConfigured();

  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(`Không thể kết nối MockAPI: ${error.message}`);
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body.message || body.error || '';
    } catch {
      detail = '';
    }
    throw new Error(
      `MockAPI trả lỗi ${response.status}${detail ? `: ${detail}` : ` ${response.statusText}`}`
    );
  }

  if (response.status === 204) return null;
  return response.json();
};

const jsonOptions = (method, data) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

const requestList = async (url) => {
  const data = await request(url);
  if (!Array.isArray(data)) {
    throw new Error('MockAPI không trả về danh sách dữ liệu hợp lệ');
  }
  return data;
};

const normalizeCourse = (course) => ({
  ...course,
  categoryId: course.categoryId ?? course.categoryID ?? '',
});

// ─── CATEGORIES ────────────────────────────────────────────

export const getCategories = async () => requestList(ENDPOINTS.categories);

export const createCategory = async (data) =>
  request(ENDPOINTS.categories, jsonOptions('POST', data));

export const updateCategory = async (id, data) =>
  request(`${ENDPOINTS.categories}/${encodeURIComponent(id)}`, jsonOptions('PUT', data));

export const deleteCategory = async (id) =>
  request(`${ENDPOINTS.categories}/${encodeURIComponent(id)}`, { method: 'DELETE' });

// ─── COURSES ───────────────────────────────────────────────

export const getCourses = async () =>
  (await requestList(ENDPOINTS.courses)).map(normalizeCourse);

export const getCourse = async (id) =>
  normalizeCourse(await request(`${ENDPOINTS.courses}/${encodeURIComponent(id)}`));

export const createCourse = async (data) =>
  request(ENDPOINTS.courses, jsonOptions('POST', data));

export const updateCourse = async (id, data) =>
  request(`${ENDPOINTS.courses}/${encodeURIComponent(id)}`, jsonOptions('PUT', data));

export const deleteCourse = async (id) =>
  request(`${ENDPOINTS.courses}/${encodeURIComponent(id)}`, { method: 'DELETE' });
