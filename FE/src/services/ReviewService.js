import axios from 'axios';

const API_URL = "http://localhost:8000/api";

const ReviewService = {
  reviewCode: async (language, code, user) => {
    const res = await axios.post(`${API_URL}/review`, { language, code, user });
    return res.data;
  },

  // Có thể mở rộng thêm các API khác như history, auto-fix nếu backend có hỗ trợ
};

export default ReviewService;
