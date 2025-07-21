import axios from 'axios';

const API_URL = "http://localhost:8000/api";

const AuthService = {
  login: async (username, password) => {
    const res = await axios.post(`${API_URL}/login`, { username, password });
    return res.data;
  },

  register: async (username, password) => {
    const res = await axios.post(`${API_URL}/register`, { username, password });
    return res.data;
  },

  getCurrentUser: () => {
    const user = sessionStorage.getItem("current_user");
    return user ? JSON.parse(user) : null;
  },

  setCurrentUser: (user) => {
    sessionStorage.setItem("current_user", JSON.stringify(user));
  },

  logout: () => {
    sessionStorage.removeItem("current_user");
  }
};

export default AuthService;
