// src/services/HistoryService.js
import axios from "axios";
import AuthService from "./AuthService";

const API_URL = "http://localhost:8000/api/history";

const getHistory = async () => {
  const user = AuthService.getCurrentUser();
  const res = await axios.get(`${API_URL}/${user.username}`);
  return res.data;
};

const getHistoryDetail = async (id) => {
  const res = await axios.get(`${API_URL}/detail/${id}`);
  return res.data;
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  getHistory,
  getHistoryDetail,
};
