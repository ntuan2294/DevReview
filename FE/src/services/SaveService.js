// src/services/SaveService.js
import axios from "axios";

const API_URL = "http://localhost:8000/api";

const saveReview = async (payload) => {
  try {
    console.log("=== BẮT ĐẦU GỌI API SAVE ===");
    console.log("URL:", `${API_URL}/history/save`);
    console.log("Payload gửi đi:", JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`${API_URL}/history/save`, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log("Response status:", response.status);
    console.log("Response data:", response.data);
    console.log("=== GỌI API THÀNH CÔNG ===");
    
    return response.data;
  } catch (error) {
    console.error("=== LỖI KHI GỌI API ===");
    console.error("Error status:", error.response?.status);
    console.error("Error data:", error.response?.data);
    console.error("Full error:", error);
    console.error("=== KẾT THÚC LỖI ===");
    throw error;
  }
};

const SaveService = {
  saveReview,
};

export default SaveService;