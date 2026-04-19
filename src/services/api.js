import axios from "axios";

const API = axios.create({
  baseURL: "https://ai-data-analytics-be.onrender.com",
  withCredentials: true   // 🔥 MUST BE TRUE
});

export default API;
