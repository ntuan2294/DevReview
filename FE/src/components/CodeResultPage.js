import React from "react";
import { useNavigate } from "react-router-dom";
import { useCode } from "./CodeContext";
import ReviewSection from "./ReviewSection";
import AuthService from "../services/AuthService";

const CodeResultPage = () => {
  const navigate = useNavigate();
  const { code, language, reviewResult, setCode, setReviewResult } = useCode();
  const currentUser = AuthService.getCurrentUser();

  // Quay lại trang editor
  const handleBack = () => navigate("/editor");
  
  const handleNew = () => {
    setCode("");
    setReviewResult(null);
    // Sử dụng replace: true để thay thế history entry thay vì thêm mới
    navigate("/editor", { replace: true });
  };
  
  const handleLogout = () => {
    AuthService.logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200">
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
              Xin chào, <span className="font-semibold">{currentUser.username}</span>
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

      <ReviewSection
        code={code}
        language={language}
        reviewResult={reviewResult}
        currentUser={currentUser}
        onBack={handleBack}
        onNew={handleNew}
      />
    </div>
  );
};

export default CodeResultPage;