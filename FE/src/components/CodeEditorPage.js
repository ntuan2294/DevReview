import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCode } from "./CodeContext";
import AuthService from "../services/AuthService";
import ReviewService from "../services/ReviewService";
import FileService from "../services/FileService";
import axios from "axios";

// FIXED: Đã sửa lỗi lặp vô hạn bằng cách tối ưu dependency arrays trong useCallback và useEffect

const CodeEditorPage = () => {
  const navigate = useNavigate();
  const { code, setCode, language, setLanguage, setReviewResult, setType } = useCode();
  const [loadingAction, setLoadingAction] = useState(null); // "review" | "explain" | null
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const currentUser = AuthService.getCurrentUser();

  // ✅ Function để tạo tên hiển thị theo format mới
  const createHistoryTitle = (item) => {
    const lang = item.language ? item.language.toUpperCase() : "UNKNOWN";
    const type = item.type || "UNKNOWN";
    const typeText = type === "Re" ? "Review" : type === "Ex" ? "Explain" : type === "Su" ? "Suggest" : "Unknown";
    return `${typeText} ${lang} Code #${item.id}`;
  };

  // ✅ Function để fetch lịch sử (dùng useCallback để fix warning)
  // FIXED: Loại bỏ historyItems.length khỏi dependency để tránh infinite loop
  const fetchHistory = useCallback(
    async (forceRefresh = false) => {
      try {
        // Chặn gọi lại khi đang loading (trừ khi forceRefresh = true)
        if (!forceRefresh && isLoadingHistory) return;

        setIsLoadingHistory(true); // <-- chỉ gọi 1 lần ở đây

        if (currentUser && currentUser.username) {
          const response = await axios.get(
            `http://localhost:8000/api/history/${currentUser.username}`,
            {
              timeout: 10000,
              headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
                Expires: "0",
                "X-Requested-At": Date.now().toString(),
              },
            }
          );

          if (response.data && Array.isArray(response.data)) {
            setHistoryItems(response.data);
            setLastRefreshTime(Date.now());
          } else {
            setHistoryItems([]);
          }

          localStorage.removeItem("history_needs_refresh");
        } else {
          setHistoryItems([]);
        }
      } catch (error) {
        console.error("❌ Error fetching history:", error);
        // FIXED: Không cần kiểm tra historyItems.length ở đây vì có thể gây ra vấn đề
        setHistoryItems([]);
      } finally {
        setIsLoadingHistory(false); // luôn reset về false sau khi fetch xong
      }
    },
    [currentUser?.username] // FIXED: Chỉ giữ currentUser?.username để tránh infinite loop
  );

  // ✅ Load lịch sử khi component mount
  useEffect(() => {
    fetchHistory(true);
  }, [fetchHistory]);

  // ✅ Listen cho custom event từ save action
  // FIXED: Loại bỏ fetchHistory khỏi dependency để tránh infinite loop
  useEffect(() => {
    const handleHistoryUpdated = () => {
      setTimeout(() => {
        fetchHistory(true);
      }, 1000);
    };
    window.addEventListener("historyUpdated", handleHistoryUpdated);
    return () =>
      window.removeEventListener("historyUpdated", handleHistoryUpdated);
  }, []); // FIXED: Không cần fetchHistory trong dependency vì event handler không thay đổi

  // ✅ Kiểm tra localStorage flag định kỳ
  // FIXED: Loại bỏ fetchHistory khỏi dependency để tránh infinite loop
  useEffect(() => {
    const checkRefreshFlag = () => {
      const needsRefresh = localStorage.getItem("history_needs_refresh");
      const lastSaveTime = localStorage.getItem("last_save_time");

      if (needsRefresh === "true" && lastSaveTime) {
        const saveTime = parseInt(lastSaveTime);
        const now = Date.now();

        if (now - saveTime < 30000) {
          fetchHistory(true);
        } else {
          localStorage.removeItem("history_needs_refresh");
          localStorage.removeItem("last_save_time");
        }
      }
    };

    checkRefreshFlag();
    const interval = setInterval(checkRefreshFlag, 3000);
    return () => clearInterval(interval);
  }, []); // FIXED: Không cần fetchHistory trong dependency vì interval callback không thay đổi

  // ✅ Listen cho window focus
  // FIXED: Loại bỏ fetchHistory khỏi dependency để tránh infinite loop
  useEffect(() => {
    const handleWindowFocus = () => {
      const lastRefreshAge = Date.now() - lastRefreshTime;
      if (lastRefreshAge > 10000) {
        fetchHistory(true);
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    return () => window.removeEventListener("focus", handleWindowFocus);
  }, [lastRefreshTime]); // FIXED: Chỉ cần lastRefreshTime, không cần fetchHistory

  // ✅ Manual refresh button handler
  const handleRefreshHistory = () => {
    fetchHistory(true);
  };

  // ✅ Filter và search lịch sử
  const filteredAndSearchedHistory = historyItems.filter((item) => {
    const matchesLanguage =
      languageFilter === "all" || item.language === languageFilter;
    const matchesSearch =
      searchTerm === "" ||
      createHistoryTitle(item)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (item.originalCode &&
        item.originalCode.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesLanguage && matchesSearch;
  });

  const availableLanguages = [
    ...new Set(historyItems.map((item) => item.language).filter(Boolean)),
  ];

  // ✅ Xử lý Review
  const handleReview = async () => {
    if (!code.trim()) {
      alert("Vui lòng nhập code trước khi gửi!");
      return;
    }

    setLoadingAction("review");
    try {
      const result = await ReviewService.reviewCode(
        language,
        code,
        currentUser?.username
      );
      setReviewResult(result);
      navigate("/result");
    } catch (error) {
      alert("Có lỗi xảy ra khi review code!");
    } finally {
      setLoadingAction(null);
    }
  };

  // ✅ Xử lý Explain
  const handleExplain = async () => {
    if (!code.trim()) {
      alert("Vui lòng nhập code trước khi gửi!");
      return;
    }

    setLoadingAction("explain");
    try {
      navigate("/explain");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSuggestName = async () => {
    if (!code.trim()) {
      alert("Vui lòng nhập code trước khi gửi!");
      return;
    }

    setLoadingAction("suggest");
    try {
      // TODO: gọi service SuggestNameService giống ReviewService, ExplainService
      navigate("/suggest"); // hoặc navigate tới trang hiển thị kết quả gợi ý
    } finally {
      setLoadingAction(null);
    }
  };

  // ✅ Upload file
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
        alert(
          `File đã được tải lên thành công! Ngôn ngữ: ${
            result.data.language || "Không xác định"
          }`
        );
      } else {
        alert(result.error);
      }
    } catch (error) {
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

  // ✅ Click vào history item
  const handleHistoryClick = async (historyId) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/history/detail/${historyId}`
      );
      const historyData = response.data;

      const reviewResult = {
        feedback: historyData.reviewSummary || "Không có feedback",
        improvedCode: historyData.fixedCode || "Không có code đã sửa",
        originalCode: historyData.originalCode || "",
        summary: historyData.reviewSummary
          ? historyData.reviewSummary.substring(0, 100) + "..."
          : "Không có tóm tắt",
        isFromHistory: true,
        historyId: historyId,
      };

      setReviewResult(reviewResult);
      setCode(historyData.originalCode || "");
      if (historyData.language) {
        setLanguage(historyData.language);
      }
      navigate("/result");
    } catch (error) {
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
              Xin chào,{" "}
              <span className="font-semibold">{currentUser?.username}</span>
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
          <div className="col-span-1 bg-white rounded-xl shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Lịch sử
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({filteredAndSearchedHistory.length}/{historyItems.length})
                </span>
              </h3>
              <button
                onClick={handleRefreshHistory}
                disabled={isLoadingHistory}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <svg
                  className={`w-4 h-4 ${
                    isLoadingHistory ? "animate-spin" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>

            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full mb-3 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            {availableLanguages.length > 0 && (
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="w-full mb-4 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả ngôn ngữ</option>
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang?.toUpperCase() || "Unknown"}
                  </option>
                ))}
              </select>
            )}

            {/* Danh sách lịch sử */}
            {isLoadingHistory ? (
              <div className="text-center text-gray-500 py-8">Đang tải...</div>
            ) : filteredAndSearchedHistory.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredAndSearchedHistory.map((item, i) => (
                  <div
                    key={`${item.id}-${i}`}
                    onClick={() => handleHistoryClick(item.id)}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer"
                  >
                    <div className="text-sm font-semibold">
                      {createHistoryTitle(item)}
                    </div>
                    {item.originalCode && (
                      <div className="text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded mt-1 line-clamp-2">
                        {item.originalCode}
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {item.language?.toUpperCase() || "N/A"}
                      </span>
                      <span>#{item.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Không có lịch sử</p>
            )}
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
                      accept=".py,.js,.java,.cpp,.cs,.php,.rb,.go"
                    />
                  </label>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleReview}
                    disabled={loadingAction !== null || !code.trim()}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      loadingAction !== null || !code.trim()
                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {loadingAction === "review"
                      ? "⏳ Đang phân tích..."
                      : "🚀 Review Code"}
                  </button>

                  <button
                    onClick={handleExplain}
                    disabled={loadingAction !== null || !code.trim()}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      loadingAction !== null || !code.trim()
                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                    }`}
                  >
                    {loadingAction === "explain"
                      ? "⏳ Đang giải thích..."
                      : "💡 Explain Code"}
                  </button>
                  {/* ✅ Thêm Suggest Name button */}
                  <button
                    onClick={handleSuggestName}
                    disabled={loadingAction !== null || !code.trim()}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      loadingAction !== null || !code.trim()
                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                        : "bg-orange-600 text-white hover:bg-orange-700"
                    }`}
                  >
                    {loadingAction === "suggest"
                      ? "⏳ Đang gợi ý..."
                      : "🏷️ Suggest Name"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditorPage;
