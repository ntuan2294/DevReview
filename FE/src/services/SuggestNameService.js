import axios from "axios";

const API_URL = "http://localhost:8000/api/suggest";

const SuggestNameService = {
  suggestNames: async (language, code) => {
    try {
      const response = await axios.post(`${API_URL}`, {
        language,
        code,
      });
      return response.data;
    } catch (error) {
      console.error("❌ Lỗi khi gọi SuggestName API:", error);
      throw error;
    }
  },
};

export default SuggestNameService;
