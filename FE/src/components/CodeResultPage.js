// CodeResultPage.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCode } from "./CodeContext";
import ReviewSection from "./ReviewSection";
import AuthService from "../services/AuthService";
import SaveService from "../services/SaveService";
import axios from "axios";

const CodeResultPage = () => {
  const navigate = useNavigate();
  const {
    code,
    language,
    reviewResult,
    setCode,
    setReviewResult,
    type,
    setType,
  } = useCode();
  const currentUser = AuthService.getCurrentUser();

  // Set type mặc định
  useEffect(() => {
    if (!type) {
      setType("Re"); // Default type cho Review
    }
  }, [type, setType]);

  const handleBack = () => navigate("/editor");

  const handleNew = async () => {
    const shouldSave =
      reviewResult &&
      currentUser &&
      currentUser.username &&
      !reviewResult.isFromHistory &&
      window.confirm("Bạn có muốn lưu kết quả review này vào lịch sử không?");

    if (shouldSave) {
      try {
        let userId;

        if (currentUser.id) {
          userId = currentUser.id;
        } else {
          const response = await axios.get(
            `http://localhost:8000/api/user/${currentUser.username}`,
            { timeout: 5000 }
          );
          userId = response.data.id;

          const updatedUser = { ...currentUser, id: userId };
          AuthService.setCurrentUser(updatedUser);
        }

        const payload = {
          userId: userId,
          username: currentUser.username,
          originalCode: code || "",
          reviewSummary: reviewResult.feedback || reviewResult.summary || "",
          fixedCode: reviewResult.improvedCode || reviewResult.fixedCode || "",
          language: language || "unknown",
          errorLines: reviewResult.errorLines || [],
          type: type || "Re",
        };

        const result = await SaveService.saveReview(payload);

        window.dispatchEvent(
          new CustomEvent("historyUpdated", {
            detail: {
              newHistoryId: result.historyId,
              username: currentUser.username,
            },
          })
        );

        localStorage.setItem("history_needs_refresh", "true");
        localStorage.setItem("last_save_time", Date.now().toString());

        alert("✅ Đã lưu kết quả vào lịch sử!");
      } catch (err) {
        let errorMessage = "Không thể lưu lịch sử.";
        if (err.message === "Request timeout") {
          errorMessage = "Lưu lịch sử mất quá nhiều thời gian.";
        } else if (err.response) {
          errorMessage = `Lỗi server: ${err.response.status} - ${
            err.response.data?.message || err.response.statusText
          }`;
        } else if (err.message) {
          errorMessage = `Lỗi: ${err.message}`;
        }

        alert(`❌ ${errorMessage}`);
      }
    }

    // Reset và chuyển trang
    setCode("");
    setReviewResult(null);
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

      <ReviewSection
        code={code}
        language={language}
        reviewResult={reviewResult}
        fixedCode={reviewResult?.fixedCode}
        currentUser={currentUser}
        onBack={handleBack}
        onNew={handleNew}
      />
    </div>
  );
};

export default CodeResultPage;
