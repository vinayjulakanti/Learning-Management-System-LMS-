import axios from 'axios';
import { API_BASE } from '../config';

const client = axios.create({
  baseURL: API_BASE,
});

client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AuthAPI = {
  login: (payload) => client.post('/auth/login', payload),
  register: (payload) => client.post('/auth/register', payload),
  me: () => client.get('/auth/me'),
  updateMe: (payload) => client.put('/auth/me', payload),
  forgot: (payload) => client.post('/auth/forgot', payload),
  reset: (payload) => client.post('/auth/reset', payload),
};

// Courses endpoints used across pages
export const CoursesAPI = {
  list: () => client.get('/courses'),
  get: (id) => client.get(`/courses/${id}`),
  create: (payload) => client.post('/courses', payload),
  update: (id, payload) => client.put(`/courses/${id}`, payload),
  delete: (id) => client.delete(`/courses/${id}`),
  claim: (id) => client.post(`/courses/${id}/claim`),
  enroll: (id) => client.post(`/courses/${id}/enroll`),
  complete: (id, payload) => client.post(`/courses/${id}/complete`, payload),
  myEnrollments: () => client.get('/enrollments/me'),
  roster: (id) => client.get(`/courses/${id}/students`),
};

// Assignments endpoints used across pages
export const AssignmentsAPI = {
  listByCourse: (courseId) => client.get(`/courses/${courseId}/assignments`),
  create: (courseId, payload) => client.post(`/courses/${courseId}/assignments`, payload),
  delete: (courseId, assignmentId) => client.delete(`/courses/${courseId}/assignments/${assignmentId}`),
  submit: (courseId, assignmentId, payload) => client.post(`/courses/${courseId}/assignments/${assignmentId}/submit`, payload),
  myGrades: () => client.get('/grades/me'),
  mySubmissions: () => client.get('/submissions/me'),
  teachingSubmissions: () => client.get('/teaching/submissions'),
  grade: (courseId, assignmentId, submissionId, payload) => client.post(`/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/grade`, payload),
};

// Site content (admin) endpoints used in AdminDashboard
export const ContentAPI = {
  get: (key) => client.get(`/content/${encodeURIComponent(key)}`),
  upsert: (key, payload) => client.put(`/content/${encodeURIComponent(key)}`, payload),
};

// Attendance endpoints
export const AttendanceAPI = {
  listByDate: (date, courseId) => client.get(`/attendance?date=${date}${courseId ? `&course=${courseId}` : ''}`),
  setStatus: (date, courseId, studentId, status) => client.put('/attendance', { date, courseId, studentId, status }),
  myForDate: (date) => client.get(`/me/attendance?date=${date}`),
  myAll: () => client.get(`/me/attendance/all`),
  mySummary: () => client.get(`/me/attendance/summary`),
};

// Notifications endpoints
export const NotificationsAPI = {
  list: (params) => client.get('/notifications', { params }),
  markRead: (id) => client.post(`/notifications/${id}/read`),
  markAllRead: () => client.post('/notifications/read-all'),
  delete: (id) => client.delete(`/notifications/${id}`),
  deleteMultiple: (ids) => client.post('/notifications/delete', { ids }),
};

// Leaves endpoints
export const LeavesAPI = {
  apply: (payload) => client.post('/leaves', payload),
  myLeaves: () => client.get('/leaves/me'),
  pending: () => client.get('/leaves/pending'),
  approve: (id) => client.post(`/leaves/${id}/approve`),
  reject: (id) => client.post(`/leaves/${id}/reject`),
};

// Fees endpoints
export const FeesAPI = {
  list: () => client.get('/fees/fees'),
  create: (payload) => client.post('/fees/fees', payload),
  update: (id, payload) => client.put(`/fees/fees/${id}`, payload),
  delete: (id) => client.delete(`/fees/fees/${id}`),
  pay: (id, payload) => client.post(`/fees/fees/${id}/pay`, payload),
};

// Certificates endpoints
export const CertificatesAPI = {
  list: () => client.get('/certificates'),
  generate: (payload) => client.post('/certificates/generate', payload),
  autoGenerate: (payload) => client.post('/certificates/auto-generate', payload),
  download: (id) => client.put(`/certificates/${id}/download`),
};

export const TasksAPI = {
  list: () => client.get('/tasks'),
  create: (payload) => client.post('/tasks', payload),
  update: (id, payload) => client.put(`/tasks/${id}`, payload),
  submit: (id) => client.put(`/tasks/${id}/submit`),
  delete: (id) => client.delete(`/tasks/${id}`),
};

export const AdminAPI = {
  users: () => client.get('/admin/users'),
  summary: () => client.get('/admin/summary'),
};

export const ActivityAPI = {
  heartbeat: (payload) => client.post('/activity/heartbeat', payload),
  log: (payload) => client.post('/activity/log', payload),
  logout: () => client.post('/activity/logout'),
  mySummary: () => client.get('/activity/my-summary'),
  adminStudents: (search) => client.get(`/activity/admin/students${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  adminReport: (studentId, start, end) => client.get(`/activity/admin/report?studentId=${studentId}${start ? `&startDate=${start}` : ''}${end ? `&endDate=${end}` : ''}`),
};

export default client;
