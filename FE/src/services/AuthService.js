import axios from 'axios';

const API_URL = "http://localhost:8000/api";

const AuthService = {
  login: async (username, password) => {
    try {
      const res = await axios.post(`${API_URL}/login`, { username, password });
      return res.data;
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: 'Lỗi kết nối server!' };
    }
  },

  register: async (username, password) => {
    try {
      const res = await axios.post(`${API_URL}/register`, { username, password });
      return res.data;
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, message: error.response?.data?.message || "Đăng ký thất bại" };
    }
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

  // Sửa method getUserId với error handling tốt hơn
  getUserId: async (username) => {
    try {
      console.log(`Đang lấy userId cho username: ${username}`);
      
      const response = await axios.get(`${API_URL}/user/${username}`, {
        timeout: 5000
      });
      
      console.log("getUserId response:", response.data);
      
      if (response.data && response.data.id) {
        return response.data.id;
      } else {
        throw new Error("User data không hợp lệ");
      }
    } catch (error) {
      console.error("Lỗi khi lấy user ID:", error);
      
      if (error.response?.status === 404) {
        throw new Error(`Không tìm thấy user với username: ${username}`);
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error("Backend server không chạy");
      } else if (error.code === 'ECONNABORTED') {
        throw new Error("Request timeout");
      } else {
        throw new Error(`Lỗi khi lấy thông tin user: ${error.message}`);
      }
    }
  }
};

export default AuthService;