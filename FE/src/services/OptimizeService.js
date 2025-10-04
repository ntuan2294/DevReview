import axios from "axios";

const API_URL = "http://localhost:8000/api/optimize"; // Backend endpoint

const OptimizeService = {
  optimizeCode: async (language, code, username) => {
    try {
      const payload = {
        language,
        code,
        user: username,
      };

      console.log("🚀 Calling Optimize API with payload:", payload);

      const response = await axios.post(API_URL, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 35000, // 35s for optimization - may take longer than other features
      });

      console.log("✅ Optimize API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error calling Optimize API:", error);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error("Timeout: Server took too long to optimize");
      } else if (error.response) {
        throw new Error(`Server Error ${error.response.status}: ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        throw new Error("Cannot connect to server");
      } else {
        throw new Error(error.message || "Unknown error");
      }
    }
  },
};

export default OptimizeService;