import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
});

export const getPO = (poId) => api.get(`/purchase-orders/${poId}`);
export const requestLoan = (poId) => api.post(`/request-loan/${poId}`);
export const getLoans = () => api.get('/loans');
export const repayLoan = (loanId) => api.post(`/repay-loan/${loanId}`);
export const getStats = () => api.get('/stats');

export default api;
