const API = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  dashboard: () => request('/dashboard'),
  items: {
    list: (params) => request(`/items?${new URLSearchParams(params || {})}`),
    get: (id) => request(`/items/${id}`),
    nextCode: () => request('/items/next-code'),
    categories: () => request('/items/categories'),
    create: (body) => request('/items', { method: 'POST', body }),
    update: (id, body) => request(`/items/${id}`, { method: 'PUT', body }),
    delete: (id) => request(`/items/${id}`, { method: 'DELETE' }),
  },
  outgoing: {
    list: () => request('/outgoing'),
    create: (body) => request('/outgoing', { method: 'POST', body }),
  },
  borrow: {
    list: (params) => request(`/borrow?${new URLSearchParams(params || {})}`),
    get: (id) => request(`/borrow/${id}`),
    create: (body) => request('/borrow', { method: 'POST', body }),
    approve: (id) => request(`/borrow/${id}/approve`, { method: 'POST' }),
    reject: (id, body) => request(`/borrow/${id}/reject`, { method: 'POST', body }),
    return: (id, body) => request(`/borrow/${id}/return`, { method: 'POST', body }),
    print: (id) => request(`/borrow/${id}/print`, { method: 'POST' }),
  },
  auth: {
    verify: (password) => request('/auth/verify', { method: 'POST', body: { password } }),
    changePassword: (body) => request('/auth/change-password', { method: 'POST', body }),
  },
  settings: {
    get: () => request('/settings'),
    update: (body) => request('/settings', { method: 'PUT', body }),
    testPrint: () => request('/settings/test-print', { method: 'POST' }),
  },
};
