import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCode } from "./CodeContext";
import AuthService from "../services/AuthService";
import ReviewService from "../services/ReviewService";
import FileService from "../services/FileService";
import axios from "axios";

const API_TIMEOUT_MS = 10000;

const CodeEditorPage = () => {
  const navigate = useNavigate();
  const {
    code,
    setCode,
    language,
    setLanguage,
    setReviewResult,
    setType,
    historyItems,
    setHistoryItems,
  } = useCode();

  const [loadingAction, setLoadingAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // ✅ FIX 1: Separate state for initial load vs refresh
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const currentUser = AuthService.getCurrentUser();
  const lastRefreshTimeRef = useRef(0);
  const mountedRef = useRef(true);
  
  // ✅ FIX 2: Stable reference for current user
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const createHistoryTitle = (item) => {
    const lang = item.language ? item.language.toUpperCase() : "UNKNOWN";
    const type = item.type || "UNKNOWN";
    const typeText =
      type === "Re"
        ? "Review"
        : type === "Ex"
        ? "Explain"
        : type === "Su"
        ? "Suggest"
        : type === "Te" // ✅ THÊM type cho Testcase
        ? "Testcase"
        : "Unknown";
    return `${typeText} ${lang} Code #${item.id}`;
  };

  // ✅ FIX 3: Optimized fetchHistory with better dependencies
  const fetchHistory = useCallback(
    async (forceRefresh = false) => {
      const user = currentUserRef.current;
      
      // Early returns to prevent unnecessary calls
      if (!user?.username) {
        console.log("[fetchHistory] No user, clearing history");
        if (mountedRef.current) {
          setHistoryItems([]);
          setHasInitialLoad(true);
        }
        return;
      }

      // Prevent concurrent requests
      if (!forceRefresh && historyLoading) {
        console.log("[fetchHistory] Already loading, skipping");
        return;
      }

      // Debounce rapid successive calls
      const now = Date.now();
      if (!forceRefresh && now - lastRefreshTimeRef.current < 2000) {
        console.log("[fetchHistory] Too soon, skipping", now - lastRefreshTimeRef.current);
        return;
      }

      // Don't fetch if we already have data and it's not a forced refresh
      if (!forceRefresh && hasInitialLoad && Array.isArray(historyItems) && historyItems.length > 0) {
        console.log("[fetchHistory] Already have data, skipping");
        return;
      }

      console.log("[fetchHistory] Starting fetch for user:", user.username);
      setHistoryLoading(true);
      
      const source = axios.CancelToken.source();
      const timeoutId = setTimeout(() => {
        source.cancel(`Timeout after ${API_TIMEOUT_MS}ms`);
      }, API_TIMEOUT_MS);

      try {
        const response = await axios.get(
          `http://localhost:8000/api/history/${user.username}`,
          {
            headers: { "Cache-Control": "no-cache" },
            cancelToken: source.token,
          }
        );

        if (!mountedRef.current) return;

        if (Array.isArray(response.data)) {
          setHistoryItems(response.data);
          lastRefreshTimeRef.current = now;
          setHasInitialLoad(true);
          console.log("[fetchHistory] Success, loaded", response.data.length, "items");
        } else {
          setHistoryItems([]);
          setHasInitialLoad(true);
          console.log("[fetchHistory] Empty or invalid response");
        }
        
        localStorage.removeItem("history_needs_refresh");
      } catch (error) {
        if (axios.isCancel(error)) {
          console.warn("[fetchHistory] Request cancelled:", error.message);
        } else {
          console.error("[fetchHistory] Error loading history:", error);
        }
        if (mountedRef.current) {
          // Don't clear existing data on error, just mark as loaded
          setHasInitialLoad(true);
        }
      } finally {
        clearTimeout(timeoutId);
        if (mountedRef.current) {
          setHistoryLoading(false);
        }
      }
    },
    [historyItems, historyLoading, hasInitialLoad, setHistoryItems] // ✅ Stable dependencies
  );

  // ✅ FIX 4: Separate effect for initial load
  useEffect(() => {
    if (currentUser?.username && !hasInitialLoad) {
      console.log("[useEffect] Initial load for user:", currentUser.username);
      fetchHistory(true);
    }
  }, [currentUser?.username, hasInitialLoad, fetchHistory]);

  // ✅ FIX 5: Separate effect for user changes (reset state)
  useEffect(() => {
    if (!currentUser?.username) {
      console.log("[useEffect] No user, resetting state");
      setHistoryItems([]);
      setHasInitialLoad(false);
    }
  }, [currentUser?.username, setHistoryItems]);

  // ✅ FIX 6: Event listener with stable function
  useEffect(() => {
    const handleHistoryUpdated = () => {
      console.log("[Event] History updated, forcing refresh");
      fetchHistory(true);
    };
    
    window.addEventListener("historyUpdated", handleHistoryUpdated);
    return () => {
      window.removeEventListener("historyUpdated", handleHistoryUpdated);
    };
  }, [fetchHistory]);

  // ✅ FIX 7: Manual refresh function
  const handleRefreshHistory = useCallback(() => {
    console.log("[Manual] Refresh triggered");
    setHasInitialLoad(false); // Reset initial load flag to force refresh
    fetchHistory(true);
  }, [fetchHistory]);

  // Filtering logic (unchanged)
  const filteredAndSearchedHistory = Array.isArray(historyItems)
    ? historyItems.filter((item) => {
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
      })
    : [];

  const availableLanguages = Array.isArray(historyItems)
    ? [...new Set(historyItems.map((item) => item.language).filter(Boolean))]
    : [];

  // Action handlers
  const handleReview = async () => {
    if (!code.trim()) {
      alert("Vui lòng nhập code trước khi gửi!");
      return;
    }
    setLoadingAction("review");
    setType("Re");
    try {
      const result = await ReviewService.reviewCode(
        language,
        code,
        currentUser?.username
      );
      setReviewResult(result);
      navigate("/result");
    } catch (error) {
      console.error("[handleReview]", error);
      alert("Có lỗi xảy ra khi review code!");
    } finally {
      if (mountedRef.current) setLoadingAction(null);
    }
  };

  const handleOptimize = () => {
    if (!code.trim()) {
      alert("Please enter code before submitting!");
      return;
    }
    setLoadingAction("optimize");
    setType("Op");
    navigate("/optimize");
    if (mountedRef.current) setLoadingAction(null);
  };

  const handleExplain = () => {
    if (!code.trim()) {
      alert("Vui lòng nhập code trước khi gửi!");
      return;
    }
    setLoadingAction("explain");
    setType("Ex");
    navigate("/explain");
    if (mountedRef.current) setLoadingAction(null);
  };

  const handleSuggestName = () => {
    if (!code.trim()) {
      alert("Vui lòng nhập code trước khi gửi!");
      return;
    }
    setLoadingAction("suggest");
    setType("Su");
    navigate("/suggest");
    if (mountedRef.current) setLoadingAction(null);
  };

  // ✅ THÊM handler cho Testcase
  const handleTestcase = () => {
    if (!code.trim()) {
      alert("Vui lòng nhập code trước khi gửi!");
      return;
    }
    setLoadingAction("testcase");
    setType("Te");
    navigate("/testcase");
    if (mountedRef.current) setLoadingAction(null);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await FileService.processFile(file);
      if (result?.success) {
        setCode(result.data.content || "");
        if (result.data.language) setLanguage(result.data.language);
        setType("");
        alert(
          `File đã được tải lên thành công! Ngôn ngữ: ${
            result.data.language || "Không xác định"
          }`
        );
      } else {
        alert(result?.error || "Lỗi xử lý file");
      }
    } catch (error) {
      console.error("[handleFileUpload]", error);
      alert("Có lỗi xảy ra khi tải file!");
    }
  };

  const handleClearCode = () => {
    setCode("");
    setType("");
  };

  const handleLogout = () => {
    AuthService.logout();
    navigate("/");
  };

  const handleHistoryClick = async (historyItem) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/history/detail/${historyItem.id}`
      );
      const historyData = response.data;

      const reviewResult = {
        feedback: historyData.reviewSummary || "No feedback available",
        improvedCode: historyData.fixedCode || "No improved code",
        originalCode: historyData.originalCode || "",
        summary: historyData.reviewSummary
          ? historyData.reviewSummary.substring(0, 100) + "..."
          : "No summary available",
        isFromHistory: true,
        historyId: historyItem.id,
      };

      setReviewResult(reviewResult);
      setCode(historyData.originalCode || "");
      if (historyData.language) setLanguage(historyData.language);

      // THÊM navigation cho optimize
      if (historyItem.type === "Re") navigate("/result");
      else if (historyItem.type === "Ex") navigate("/explain");
      else if (historyItem.type === "Su") navigate("/suggest");
      else if (historyItem.type === "Te") navigate("/testcase");
      else if (historyItem.type === "Op") navigate("/optimize"); // THÊM route optimize
      else navigate("/result");
    } catch (error) {
      console.error("[handleHistoryClick]", error);
      alert("Cannot load history details!");
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
          <div className="col-span-1 bg-white rounded-xl shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Lịch sử
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({filteredAndSearchedHistory.length}/{Array.isArray(historyItems) ? historyItems.length : 0})
                </span>
              </h3>
              <button
                onClick={handleRefreshHistory}
                disabled={historyLoading}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh history"
              >
                <svg
                  className={`w-4 h-4 ${historyLoading ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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

            {/* ✅ FIX 8: Better loading state display */}
            {historyLoading && !hasInitialLoad ? (
              <div className="text-center text-gray-500 py-8">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Đang tải lịch sử...
              </div>
            ) : filteredAndSearchedHistory.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredAndSearchedHistory.map((item, i) => (
                  <div
                    key={`${item.id}-${i}`}
                    onClick={() => handleHistoryClick(item)}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                  >
                    <div className="text-sm font-semibold">{createHistoryTitle(item)}</div>
                    {item.originalCode && (
                      <div className="text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded mt-1 line-clamp-2">
                        {item.originalCode.length > 100 
                          ? item.originalCode.substring(0, 100) + "..." 
                          : item.originalCode}
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {item.language?.toUpperCase() || "N/A"}
                      </span>
                      {/* ✅ THÊM màu cho type Testcase */}
                      <span className={`px-2 py-1 rounded-full ${
                        item.type === "Re" ? "bg-blue-100 text-blue-800" :
                        item.type === "Ex" ? "bg-purple-100 text-purple-800" :
                        item.type === "Su" ? "bg-orange-100 text-orange-800" :
                        item.type === "Te" ? "bg-green-100 text-green-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {item.type === "Re" ? "Review" : 
                         item.type === "Ex" ? "Explain" : 
                         item.type === "Su" ? "Suggest" : 
                         item.type === "Te" ? "Test" : 
                         "Unknown"}
                      </span>
                      <span>#{item.id}</span>
                    </div>
                  </div>
                ))}
                {/* ✅ Show refresh indicator */}
                {historyLoading && hasInitialLoad && (
                  <div className="text-center text-gray-400 py-2">
                    <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full mx-auto"></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {hasInitialLoad ? "Không có lịch sử" : "Chưa tải lịch sử"}
              </div>
            )}
          </div>

          {/* Main Editor - Updated Layout với Vertical Buttons */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Language:</label>
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

              {/* Code Editor Area với Button Panel bên phải */}
              <div className="flex gap-4 mb-6">
                {/* Code Editor - Chiếm phần lớn không gian */}
                <div className="flex-1">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter your code here or select from history..."
                    className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
                  />
                </div>

                {/* Vertical Button Panel - Bên phải */}
                <div className="flex flex-col space-y-3 min-w-[140px]">
                  <button 
                    onClick={handleReview} 
                    disabled={loadingAction !== null || !code.trim()} 
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex flex-col items-center space-y-1 ${
                      loadingAction !== null || !code.trim() 
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                        : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
                    }`}
                  >
                    {loadingAction === "review" ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        <span className="text-xs">Reviewing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold">Review</span>
                        <span className="text-xs opacity-90">Code</span>
                      </>
                    )}
                  </button>

                  <button 
                    onClick={handleExplain} 
                    disabled={loadingAction !== null || !code.trim()} 
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex flex-col items-center space-y-1 ${
                      loadingAction !== null || !code.trim() 
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                        : "bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg transform hover:-translate-y-0.5"
                    }`}
                  >
                    {loadingAction === "explain" ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        <span className="text-xs">Explaining...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold">Explain</span>
                        <span className="text-xs opacity-90">Code</span>
                      </>
                    )}
                  </button>

                  <button 
                    onClick={handleSuggestName} 
                    disabled={loadingAction !== null || !code.trim()} 
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex flex-col items-center space-y-1 ${
                      loadingAction !== null || !code.trim() 
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                        : "bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg transform hover:-translate-y-0.5"
                    }`}
                  >
                    {loadingAction === "suggest" ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        <span className="text-xs">Suggesting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="text-sm font-semibold">Suggest</span>
                        <span className="text-xs opacity-90">Names</span>
                      </>
                    )}
                  </button>

                  <button 
                    onClick={handleTestcase} 
                    disabled={loadingAction !== null || !code.trim()} 
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex flex-col items-center space-y-1 ${
                      loadingAction !== null || !code.trim() 
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                        : "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5"
                    }`}
                  >
                    {loadingAction === "testcase" ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        <span className="text-xs">Generating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-sm font-semibold">Generate</span>
                        <span className="text-xs opacity-90">Tests</span>
                      </>
                    )}
                  </button>

                  <button 
                    onClick={handleOptimize} 
                    disabled={loadingAction !== null || !code.trim()} 
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex flex-col items-center space-y-1 ${
                      loadingAction !== null || !code.trim() 
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                        : "bg-pink-600 text-white hover:bg-pink-700 hover:shadow-lg transform hover:-translate-y-0.5"
                    }`}
                  >
                    {loadingAction === "testcase" ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        <span className="text-xs">Generating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-sm font-semibold">Optimize</span>
                        <span className="text-xs opacity-90">Code</span>
                      </>
                    )}
                  </button>
                  {/* Divider */}
                  <div className="border-t border-gray-200 my-2"></div>

                  {/* Utility Buttons */}
                  <button 
                    onClick={handleClearCode} 
                    className="w-full px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Clear</span>
                  </button>

                  <label className="w-full px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload</span>
                    <input 
                      type="file" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept=".py,.js,.java,.cpp,.cs,.php,.rb,.go" 
                    />
                  </label>
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