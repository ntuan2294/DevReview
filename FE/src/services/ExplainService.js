import axios from "axios";

const API_URL = "http://localhost:8000/api/explain"; // backend endpoint

const ExplainService = {
  explainCode: async (language, code, username) => {
    try {
      const payload = {
        language,
        code,
        username, // nếu bạn muốn lưu ai gửi (có thể bỏ nếu không cần)
      };

      const response = await axios.post(API_URL, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 20000, // 20s
      });

      return response.data;
    } catch (error) {
      console.error("❌ Lỗi khi gọi Explain API:", error);
      throw error;
    }
  },
};

export default ExplainService;
