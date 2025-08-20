import axios from 'axios';

const API_URL = "http://localhost:8000/api"; // Fix URL để khớp với SaveService

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
  },

  // Thêm method để lấy userId từ backend
  getUserId: async (username) => {
    try {
      const response = await axios.get(`${API_URL}/user/${username}`);
      return response.data.id;
    } catch (error) {
      console.error("Lỗi khi lấy user ID:", error);
      throw error;
    }
  }
};

export default AuthService;