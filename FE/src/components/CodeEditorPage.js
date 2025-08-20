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
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const currentUser = AuthService.getCurrentUser();

  // ✅ Function để tạo tên hiển thị theo format mới
  const createHistoryTitle = (item) => {
    const lang = item.language ? item.language.toUpperCase() : 'UNKNOWN';
    return `Review ${lang} Code #${item.id}`;
  };

  // ✅ Function để fetch lịch sử với force refresh option
  const fetchHistory = async (forceRefresh = false) => {
    try {
      if (!forceRefresh && isLoadingHistory) return;
      
      if (forceRefresh || !isLoadingHistory) setIsLoadingHistory(true);
      
      if (currentUser && currentUser.username) {
        console.log("🔄 Fetching lịch sử cho user:", currentUser.username);
        console.log("🔄 Force refresh:", forceRefresh);
        console.log("🔄 Timestamp:", new Date().toISOString());
        
        const response = await axios.get(`http://localhost:8000/api/history/${currentUser.username}`, {
          timeout: 10000,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Requested-At': Date.now().toString()
          }
        });
        
        console.log("✅ Raw response data:", response.data);
        console.log("📊 Records count:", response.data?.length || 0);
        
        if (response.data && Array.isArray(response.data)) {
          response.data.forEach((item, index) => {
            console.log(`📄 History record ${index + 1}:`, {
              id: item.id,
              userId: item.user?.id,
              username: item.user?.username,
              language: item.language,
              summary: item.reviewSummary ? item.reviewSummary.substring(0, 50) + "..." : "No summary",
              createdAt: item.createdAt,
              hasOriginalCode: !!item.originalCode,
              hasFixedCode: !!item.fixedCode
            });
          });
          
          setHistoryItems(response.data);
          setLastRefreshTime(Date.now());
          console.log("✅ State updated successfully");
        } else {
          console.warn("⚠️ Response data is not an array:", response.data);
          setHistoryItems([]);
        }
        
        localStorage.removeItem('history_needs_refresh');
        
      } else {
        console.warn("⚠️ No currentUser or username available");
        setHistoryItems([]);
      }
    } catch (error) {
      console.error("❌ Error fetching history:", error);
      console.error("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });
      
      if (!historyItems.length) {
        setHistoryItems([]);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // ✅ Load lịch sử khi component mount
  useEffect(() => {
    console.log("🚀 CodeEditorPage mounted, fetching history...");
    fetchHistory(true);
  }, [currentUser?.username]);

  // ✅ Listen cho custom event từ save action
  useEffect(() => {
    const handleHistoryUpdated = (event) => {
      console.log("🔔 Received historyUpdated event:", event.detail);
      setTimeout(() => {
        fetchHistory(true);
      }, 1000);
    };

    window.addEventListener('historyUpdated', handleHistoryUpdated);
    return () => window.removeEventListener('historyUpdated', handleHistoryUpdated);
  }, []);

  // ✅ Kiểm tra localStorage flag định kỳ
  useEffect(() => {
    const checkRefreshFlag = () => {
      const needsRefresh = localStorage.getItem('history_needs_refresh');
      const lastSaveTime = localStorage.getItem('last_save_time');
      
      if (needsRefresh === 'true' && lastSaveTime) {
        const saveTime = parseInt(lastSaveTime);
        const now = Date.now();
        
        if (now - saveTime < 30000) {
          console.log("🔄 Flag detected, refreshing history...");
          fetchHistory(true);
        } else {
          localStorage.removeItem('history_needs_refresh');
          localStorage.removeItem('last_save_time');
        }
      }
    };

    checkRefreshFlag();
    const interval = setInterval(checkRefreshFlag, 3000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Listen cho window focus
  useEffect(() => {
    const handleWindowFocus = () => {
      console.log("🔍 Window focused, checking for updates...");
      const lastRefreshAge = Date.now() - lastRefreshTime;
      
      if (lastRefreshAge > 10000) {
        fetchHistory(true);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [lastRefreshTime]);

  // ✅ Manual refresh button handler
  const handleRefreshHistory = () => {
    console.log("🔄 Manual refresh requested");
    fetchHistory(true);
  };

  // ✅ Filter và search lịch sử
  const filteredAndSearchedHistory = historyItems.filter(item => {
    const matchesLanguage = languageFilter === 'all' || item.language === languageFilter;
    const matchesSearch = searchTerm === '' || 
      createHistoryTitle(item).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.originalCode && item.originalCode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesLanguage && matchesSearch;
  });

  // ✅ Lấy danh sách ngôn ngữ có trong lịch sử
  const availableLanguages = [...new Set(historyItems.map(item => item.language).filter(Boolean))];

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

  const detectLanguageFromCode = (codeContent) => {
    if (!codeContent) return null;
    
    const lowerCode = codeContent.toLowerCase();
    
    if (lowerCode.includes('def ') || lowerCode.includes('import ') || lowerCode.includes('print(')) {
      return 'python';
    } else if (lowerCode.includes('function') || lowerCode.includes('var ') || lowerCode.includes('let ') || lowerCode.includes('const ')) {
      return 'javascript';
    } else if (lowerCode.includes('public class') || lowerCode.includes('system.out.')) {
      return 'java';
    } else if (lowerCode.includes('#include') || lowerCode.includes('cout <<')) {
      return 'cpp';
    } else if (lowerCode.includes('using system') || lowerCode.includes('console.write')) {
      return 'csharp';
    }
    
    return null;
  };

  // ✅ Click vào history item
  const handleHistoryClick = async (historyId) => {
    try {
      console.log(`🔍 Loading history detail for ID: ${historyId}`);
      
      const response = await axios.get(`http://localhost:8000/api/history/detail/${historyId}`);
      const historyData = response.data;
      
      console.log("✅ Loaded history data:", historyData);
      
      const reviewResult = {
        feedback: historyData.reviewSummary || "Không có feedback",
        improvedCode: historyData.fixedCode || "Không có code đã sửa",
        originalCode: historyData.originalCode || "",
        summary: historyData.reviewSummary ? historyData.reviewSummary.substring(0, 100) + "..." : "Không có tóm tắt",
        isFromHistory: true,
        historyId: historyId
      };
      
      setReviewResult(reviewResult);
      setCode(historyData.originalCode || "");
      
      // Set language từ database hoặc detect từ code
      if (historyData.language) {
        setLanguage(historyData.language);
      } else {
        const detectedLanguage = detectLanguageFromCode(historyData.originalCode);
        if (detectedLanguage) {
          setLanguage(detectedLanguage);
        }
      }
      
      navigate("/result");
    } catch (error) {
      console.error("❌ Error loading history detail:", error);
      
      let errorMessage = "Không thể tải chi tiết lịch sử!";
      if (error.response?.status === 404) {
        errorMessage = "Lịch sử review này không tồn tại!";
      } else if (error.response?.status >= 500) {
        errorMessage = "Lỗi server, vui lòng thử lại sau!";
      }
      
      alert(errorMessage);
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
              {/* Header với search và filter */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Lịch sử Review
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({filteredAndSearchedHistory.length}/{historyItems.length})
                  </span>
                </h3>
                <button
                  onClick={handleRefreshHistory}
                  disabled={isLoadingHistory}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh lịch sử"
                >
                  <svg 
                    className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {/* Search box */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Language filter */}
              {availableLanguages.length > 0 && (
                <div className="mb-4">
                  <select
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tất cả ngôn ngữ</option>
                    {availableLanguages.map(lang => (
                      <option key={lang} value={lang}>
                        {lang?.toUpperCase() || 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* History list */}
              {isLoadingHistory ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm">Đang tải lịch sử...</p>
                </div>
              ) : filteredAndSearchedHistory.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredAndSearchedHistory.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      onClick={() => handleHistoryClick(item.id)}
                      className="group p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200"
                    >
                      {/* Tiêu đề chính theo format mới */}
                      <div className="text-sm font-semibold text-gray-800 mb-2">
                        {createHistoryTitle(item)}
                      </div>
                      
                      {/* Thông tin ngày tạo */}
                      <div className="text-xs text-gray-500 mb-2">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      
                      {/* Code preview */}
                      {item.originalCode && (
                        <div className="text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded group-hover:bg-blue-50 mb-2">
                          <div className="line-clamp-2">
                            {item.originalCode.length > 60 
                              ? `${item.originalCode.substring(0, 57)}...` 
                              : item.originalCode}
                          </div>
                        </div>
                      )}
                      
                      {/* Footer với badge */}
                      <div className="flex justify-between items-center">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full group-hover:bg-blue-200 font-medium">
                          {item.language ? item.language.toUpperCase() : 'N/A'}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          #{item.id}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm">
                    {historyItems.length === 0 
                      ? "Chưa có lịch sử review" 
                      : "Không tìm thấy kết quả phù hợp"
                    }
                  </p>
                  <p className="text-xs mt-1">
                    {historyItems.length === 0 
                      ? "Hãy review code đầu tiên!" 
                      : "Thử thay đổi từ khóa tìm kiếm"
                    }
                  </p>
                  
                  {/* Debug info chỉ hiện khi không có data */}
                  {historyItems.length === 0 && (
                    <div className="mt-4 text-xs text-gray-400 space-y-1">
                      <p>User: {currentUser?.username || 'null'}</p>
                      <p>Loading: {isLoadingHistory ? 'Yes' : 'No'}</p>
                      <p>Last refresh: {new Date(lastRefreshTime).toLocaleTimeString()}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Editor */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl shadow-md p-6">
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

              <div className="mb-6">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Nhập code tại đây hoặc chọn từ lịch sử review..."
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
                  style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", consolas, "source-code-pro", monospace' }}
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="flex space-x-3">
                  <button
                    onClick={handleClearCode}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    🗑️ Xóa
                  </button>
                  
                  <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                    📁 Tải file
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
                      Đang phân tích...
                    </span>
                  ) : (
                    "🚀 Review Code"
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