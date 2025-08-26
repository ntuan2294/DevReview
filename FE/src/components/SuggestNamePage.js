import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCode } from "./CodeContext";
import SuggestSection from "./SuggestSection"; // ✅ Chính xác
import AuthService from "../services/AuthService";
import SaveService from "../services/SaveService";
import SuggestNameService from "../services/SuggestNameService";
import axios from "axios";

const SuggestNamePage = () => {
  const navigate = useNavigate();
  const { code, language, reviewResult, setCode, setReviewResult, type, setType } = useCode();
  const currentUser = AuthService.getCurrentUser();

  // ✅ Set type khi component load
  useEffect(() => {
    if (!type) {
      setType("Su"); // Default type cho Suggest
    }
  }, [type, setType]);

  const handleBack = () => navigate("/editor");

  const handleNew = async () => {
    const shouldSave =
      code &&
      currentUser &&
      currentUser.username &&
      !reviewResult?.isFromHistory &&
      window.confirm(
        "Bạn có muốn lưu kết quả gợi ý tên này vào lịch sử không?"
      );

    if (shouldSave) {
      try {
        let userId = currentUser.id;

        // ✅ Lấy userId nếu chưa có
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
            console.error("❌ Không thể lấy userId:", err);
            alert("Không thể lấy thông tin user. Vui lòng đăng nhập lại.");
            AuthService.logout();
            navigate("/");
            return;
          }
        }

        // ✅ Gọi SuggestNameService để lấy gợi ý
        let suggestionText = "";
        try {
          console.log("🔄 Gọi SuggestNameService để lưu...");
          const suggestResult = await SuggestNameService.suggestNames(
            language,
            code,
            currentUser.username
          );

          // ✅ Lấy suggestions từ response
          suggestionText =
            suggestResult.suggestions ||
            suggestResult.explanation ||
            suggestResult.feedback ||
            "Không có gợi ý tên.";

          console.log(
            "✅ Lấy được suggestions:",
            suggestionText.substring(0, 100) + "..."
          );
        } catch (err) {
          console.error("❌ Lỗi khi gọi SuggestNameService:", err);
          suggestionText = `⚠ Lỗi khi lấy gợi ý: ${err.message}`;
        }

        // ✅ Payload để lưu vào database
        const payload = {
          userId,
          username: currentUser.username,
          originalCode: code || "",
          reviewSummary: suggestionText, // ⚡ lưu gợi ý vào reviewSummary
          fixedCode: null, // ⚡ suggest không có fixed code
          language: language || "unknown",
          type: type || "Su", // ✅ Thêm type cho Suggest
        };

        console.log("📦 Payload để lưu:", {
          ...payload,
          reviewSummary: payload.reviewSummary.substring(0, 100) + "...", // log ngắn gọn
        });

        const result = await SaveService.saveReview(payload);
        console.log("✅ Lưu lịch sử thành công!", result);

        // ✅ Dispatch event để update history
        window.dispatchEvent(
          new CustomEvent("historyUpdated", {
            detail: {
              newHistoryId: result.historyId,
              username: currentUser.username,
            },
          })
        );

        // ✅ Set flag để CodeEditorPage refresh
        localStorage.setItem("history_needs_refresh", "true");
        localStorage.setItem("last_save_time", Date.now().toString());

        alert("✅ Đã lưu kết quả gợi ý tên vào lịch sử!");
      } catch (err) {
        console.error("❌ Lỗi khi lưu lịch sử:", err);

        let errorMessage = "Không thể lưu lịch sử.";
        if (err.response) {
          errorMessage = `Lỗi server: ${err.response.status} - ${
            err.response.data?.message || err.response.statusText
          }`;
        } else if (err.message) {
          errorMessage = `Lỗi: ${err.message}`;
        }

        alert(`❌ ${errorMessage}\n\nVui lòng thử lại sau.`);
      }
    }

    // ✅ Reset và navigate về editor
    setCode("");
    setReviewResult(null);
    navigate("/editor", { replace: true });
  };

  const handleLogout = () => {
    AuthService.logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-200">
      {" "}
      {/* ✅ Màu khác với explain */}
      <header className="bg-transparent shadow-none border-none">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1
            className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-700 via-yellow-700 to-red-600 drop-shadow-md tracking-wide"
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
      {/* ✅ Sử dụng SuggestSection */}
      <SuggestSection
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

export default SuggestNamePage;
