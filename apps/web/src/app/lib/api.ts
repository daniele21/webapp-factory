import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // Attach request id for debugging if server sends it
    const rid = err?.response?.headers?.['x-request-id']
    if (rid) console.warn('RequestId:', rid)
    return Promise.reject(err)
  }
)
