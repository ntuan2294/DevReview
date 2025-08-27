import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCode } from "./CodeContext";
import ExplainSection from "./ExplainSection";
import AuthService from "../services/AuthService";
import SaveService from "../services/SaveService";
import ExplainService from "../services/ExplainService";
import axios from "axios";

const ExplainCodePage = () => {
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

  // ✅ Set type khi component load
  useEffect(() => {
    if (!type) {
      setType("Ex"); // Default type cho Explain
    }
  }, [type, setType]);

  const handleBack = () => navigate("/editor");

  const handleNew = async () => {
    const shouldSave =
      code &&
      currentUser &&
      currentUser.username &&
      !reviewResult?.isFromHistory &&
      window.confirm("Bạn có muốn lưu kết quả explain này vào lịch sử không?");

    if (shouldSave) {
      try {
        let userId = currentUser.id;
        if (!userId) {
          try {
            const response = await axios.get(
              `http://localhost:8000/api/user/${currentUser.username}`,
              { timeout: 5000 }
            );
            userId = response.data.id;
            const updatedUser = { ...currentUser, id: userId };
            AuthService.setCurrentUser(updatedUser);
          } catch (err) {
            alert("Không thể lấy thông tin user. Vui lòng đăng nhập lại.");
            AuthService.logout();
            navigate("/");
            return;
          }
        }

        // ✅ Gọi ExplainService để lấy giải thích
        let explanationText = "";
        try {
          const explainResult = await ExplainService.explainCode(
            language,
            code,
            currentUser.username
          );
          explanationText = explainResult.explanation || "";
        } catch (err) {
          console.error("❌ Lỗi khi gọi ExplainService:", err);
          explanationText = "⚠ Không thể lấy giải thích.";
        }

        // ✅ Payload: feedback = explain, fixedCode = null
        const payload = {
          userId,
          username: currentUser.username,
          originalCode: code || "",
          reviewSummary: explanationText, // ⚡ lưu vào feedback (BE mapping)
          fixedCode: null, // ⚡ bỏ code sửa
          language: language || "unknown",
          type: type || "Ex", // ✅ Thêm type cho Explain
        };

        console.log("Payload gửi đi:", JSON.stringify(payload, null, 2));
        const result = await SaveService.saveReview(payload);
        console.log("✅ Lưu lịch sử thành công!", result);

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

        alert("✅ Đã lưu kết quả explain vào lịch sử!");
      } catch (err) {
        console.error("Lỗi khi lưu lịch sử:", err);
        alert("❌ Không thể lưu lịch sử. Vui lòng thử lại.");
      }
    }

    // ✅ reset sau khi lưu
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

      <ExplainSection
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

export default ExplainCodePage;
