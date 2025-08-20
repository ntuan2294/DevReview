import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCode } from "./CodeContext";
import AuthService from "../services/AuthService";
import ReviewService from "../services/ReviewService";
import FileService from "../services/FileService";
import axios from "axios";

const CodeEditorPage = () => {
  const navigate = useNavigate();
  const { code, setCode, language, setLanguage, setReviewResult } = useCode();
  const [isLoading, setIsLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const currentUser = AuthService.getCurrentUser();

  // Load lịch sử khi component mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (currentUser && currentUser.username) {
          const response = await axios.get(`http://localhost:8000/api/history/${currentUser.username}`);
          setHistoryItems(response.data);
        }
      } catch (error) {
        console.error("Lỗi khi load lịch sử:", error);
      }
    };
    
    fetchHistory();
  }, [currentUser]);

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert("Vui lòng nhập code trước khi gửi!");
      return;
    }

    setIsLoading(true);
    try {
      const result = await ReviewService.reviewCode(language, code, currentUser?.username);
      setReviewResult(result);
      navigate("/result");
    } catch (error) {
      console.error("Review error:", error);
      alert("Có lỗi xảy ra khi review code!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await FileService.processFile(file);
      if (result.success) {
        setCode(result.data.content);
        if (result.data.language) {
          setLanguage(result.data.language);
        }
        alert(`File đã được tải lên thành công! Ngôn ngữ: ${result.data.language || 'Không xác định'}`);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("File upload error:", error);
      alert("Có lỗi xảy ra khi tải file!");
    }
  };

  const handleClearCode = () => {
    setCode("");
  };

  const handleLogout = () => {
    AuthService.logout();
    navigate("/");
  };

  // Xử lý click vào item lịch sử
  const handleHistoryClick = async (historyId) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/history/detail/${historyId}`);
      const historyData = response.data;
      
      // Set dữ liệu vào context để hiển thị ở CodeResultPage
      setReviewResult({
        feedback: historyData.reviewSummary,
        improvedCode: historyData.fixedCode,
        originalCode: historyData.originalCode
      });
      
      // Set code và language từ history (nếu có)
      setCode(historyData.originalCode || "");
      // Note: Nếu bạn lưu language trong DB, hãy thêm vào đây
      
      // Điều hướng sang trang result
      navigate("/result");
    } catch (error) {
      console.error("Lỗi khi load chi tiết lịch sử:", error);
      alert("Không thể tải chi tiết lịch sử!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200">
      {/* Header */}
      <header className="bg-transparent shadow-none border-none">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1
            className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 drop-shadow-md tracking-wide"
            style={{ fontFamily: '"Orbitron", sans-serif' }}
          >
            DEVREVIEW
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-800">
              Xin chào, <span className="font-semibold">{currentUser?.username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 border border-red-600 px-3 py-1 rounded hover:bg-red-600 hover:text-white transition-colors bg-transparent"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-6">
          {/* Sidebar - Lịch sử */}
          <div className="col-span-1">
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Lịch sử</h3>
              
              {historyItems.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {historyItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleHistoryClick(item.id)}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {/* Hiển thị tên từ summary hoặc fallback */}
                        {item.reviewSummary 
                          ? (item.reviewSummary.length > 50 
                              ? `${item.reviewSummary.substring(0, 50)}...` 
                              : item.reviewSummary)
                          : `Review code - ${new Date(item.createdAt).toLocaleDateString()}`
                        }
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">Chưa có lịch sử review</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Editor */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl shadow-md p-6">
              {/* Language Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngôn ngữ:
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-48 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="python">PYTHON</option>
                  <option value="javascript">JAVASCRIPT</option>
                  <option value="java">JAVA</option>
                  <option value="cpp">C++</option>
                  <option value="csharp">C#</option>
                  <option value="php">PHP</option>
                  <option value="ruby">RUBY</option>
                  <option value="go">GO</option>
                </select>
              </div>

              {/* Code Editor */}
              <div className="mb-6">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Nhập code tại đây..."
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
                  style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", consolas, "source-code-pro", monospace' }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="flex space-x-3">
                  <button
                    onClick={handleClearCode}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Xóa
                  </button>
                  
                  <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                    📁 Gửi file
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".py,.js,.jsx,.ts,.tsx,.java,.cpp,.c,.h,.php,.rb,.go,.cs,.html,.css"
                    />
                  </label>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !code.trim()}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isLoading || !code.trim()
                      ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    "⚠ Gửi"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditorPage;