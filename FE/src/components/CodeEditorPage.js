import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCode } from "./CodeContext";
import ReviewSection from "./ReviewSection";
import AuthService from "../services/AuthService";
import SaveService from "../services/SaveService"; // gọi API save history
import axios from "axios";

const CodeResultPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // lấy id nếu đi từ lịch sử
  const { code, language, reviewResult, setCode, setReviewResult } = useCode();
  const currentUser = AuthService.getCurrentUser();

  // state khi load từ DB
  const [historyData, setHistoryData] = useState(null);

  // Nếu có id (người dùng bấm lịch sử) → gọi API để lấy dữ liệu
  useEffect(() => {
    if (id) {
      axios
        .get(`/api/history/item/${id}`)
        .then((res) => {
          setHistoryData(res.data);
        })
        .catch((err) => {
          console.error("Lỗi khi load history:", err);
        });
    }
  }, [id]);

  // Quay lại trang editor
  const handleBack = () => navigate("/editor");

  // Code mới → lưu lịch sử trước rồi reset state
  const handleNew = async () => {
    try {
      if (reviewResult && currentUser) {
        await SaveService.saveHistory({
          username: currentUser.username,
          language,
          code,
          feedback: reviewResult.feedback,
          fixedCode: reviewResult.fixedCode,
        });
      }
    } catch (err) {
      console.error("Lỗi khi lưu lịch sử:", err);
    }
    // reset editor
    setCode("");
    setReviewResult(null);
    navigate("/editor", { replace: true });
  };

  const handleLogout = () => {
    AuthService.logout();
    navigate("/");
  };

  // Lấy dữ liệu để truyền xuống ReviewSection
  const displayData = id ? historyData : reviewResult;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex flex-col">
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
              <span className="font-semibold">{currentUser.username}</span>
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

      {/* Body */}
      <div className="flex-1 max-w-7xl mx-auto px-6 py-6 w-full">
        {displayData ? (
          <ReviewSection
            code={id ? historyData?.code : code}
            language={id ? historyData?.language : language}
            reviewResult={displayData}
            fixedCode={id ? historyData?.fixedCode : reviewResult?.fixedCode}
            currentUser={currentUser}
            onBack={handleBack}
            onNew={handleNew}
          />
        ) : (
          <p className="text-center text-gray-600">
            Đang tải dữ liệu hoặc chưa có kết quả review...
          </p>
        )}
      </div>
    </div>
  );
};

export default CodeResultPage;
