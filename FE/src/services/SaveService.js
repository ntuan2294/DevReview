// src/services/SaveService.js
import axios from "axios";

const API_URL = "http://localhost:8000/api";

// Retry function
const retryRequest = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && (error.code === 'NETWORK_ERROR' || error.response?.status >= 500)) {
      console.log(`Retry attempt remaining: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

const saveReview = async (payload) => {
  try {
    console.log("=== BẮT ĐẦU GỌI API SAVE ===");
    console.log("URL:", `${API_URL}/history/save`);
    console.log("Payload gửi đi:", JSON.stringify(payload, null, 2));
    
    // Kiểm tra kết nối backend trước
    try {
      const healthCheck = await axios.get(`${API_URL}/user/${payload.username}`, {
        timeout: 5000
      });
      console.log("Backend connection OK:", healthCheck.status);
    } catch (healthError) {
      console.error("Backend không khả dụng:", healthError.message);
      throw new Error("Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không.");
    }
    
    // Gọi API save với retry
    const response = await retryRequest(async () => {
      return axios.post(`${API_URL}/history/save`, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds timeout
      });
    });
    
    console.log("Response status:", response.status);
    console.log("Response data:", response.data);
    console.log("=== GỌI API THÀNH CÔNG ===");
    
    return response.data;
  } catch (error) {
    console.error("=== LỖI KHI GỌI API ===");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error status:", error.response?.status);
    console.error("Error data:", error.response?.data);
    console.error("Full error:", error);
    console.error("=== KẾT THÚC LỖI ===");
    
    // Ném lỗi với thông tin rõ ràng hơn
    if (error.code === 'ECONNREFUSED') {
      throw new Error("Backend server không chạy (port 8000)");
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error("Lỗi mạng - kiểm tra kết nối internet");
    } else if (error.code === 'ECONNABORTED') {
      throw new Error("Request timeout - server phản hồi chậm");
    } else if (error.response?.status === 404) {
      throw new Error("API endpoint không tồn tại");
    } else if (error.response?.status === 500) {
      throw new Error(`Lỗi server: ${error.response.data?.message || 'Internal Server Error'}`);
    } else {
      throw error;
    }
  }
};

const SaveService = {
  saveReview,
  // Thêm function mới để lưu với type
  saveWithType: async (payload, type) => {
    const payloadWithType = {
      ...payload,
      type: type // "Re", "Ex", "Su"
    };
    return await saveReview(payloadWithType);
  }
};

export default SaveService;