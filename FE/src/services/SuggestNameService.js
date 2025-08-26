import axios from "axios";

const API_URL = "http://localhost:8000/api/suggest"; // ✅ Endpoint chính xác

const SuggestNameService = {
  suggestNames: async (language, code, username) => {
    try {
      const payload = {
        language,
        code,
        user: username, // ✅ Theo format của ReviewRequest.java
      };

      console.log("🔄 Gọi SuggestName API với payload:", payload);

      const response = await axios.post(API_URL, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30s cho suggest có thể mất thời gian
      });

      console.log("✅ SuggestName API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Lỗi khi gọi SuggestName API:", error);

      // ✅ Xử lý các loại lỗi chi tiết
      if (error.code === "ECONNABORTED") {
        throw new Error("Timeout: Server mất quá nhiều thời gian phản hồi");
      } else if (error.response) {
        throw new Error(
          `Server Error ${error.response.status}: ${
            error.response.data?.message || error.response.statusText
          }`
        );
      } else if (error.request) {
        throw new Error("Không thể kết nối đến server");
      } else {
        throw new Error(error.message || "Lỗi không xác định");
      }
    }
  },
};

export default SuggestNameService;
