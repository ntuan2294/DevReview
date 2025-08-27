// src/services/HistoryService.js
import axios from "axios";

const API_URL = "/api/history/";

const HistoryService = {
  getHistory: (username) => axios.get(`${API_URL}${username}`),
};

export default HistoryService;
