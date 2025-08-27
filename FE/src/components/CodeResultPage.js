// CodeResultPage.js - Updated to handle error lines
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

  // ✅ Set type khi component load
  useEffect(() => {
    if (!type) {
      setType("Re"); // Default type cho Review
    }
  }, [type, setType]);

  const handleBack = () => navigate("/editor");

  const handleNew = async () => {
    console.log("=== BẮT ĐẦU HANDLE NEW ===");
    console.log("Current user:", currentUser);
    console.log("Review result:", reviewResult);
    console.log("Language:", language);
    console.log("Error lines:", reviewResult?.errorLines); // ✅ THÊM log error lines

    // Hỏi user có muốn lưu không (nếu có dữ liệu và chưa phải từ history)
    const shouldSave =
      reviewResult &&
      currentUser &&
      currentUser.username &&
      !reviewResult.isFromHistory && // Không lưu lại nếu đây là data từ history
      window.confirm("Bạn có muốn lưu kết quả review này vào lịch sử không?");

    if (shouldSave) {
      try {
        let userId;

        // Lấy userId
        if (currentUser.id) {
          userId = currentUser.id;
          console.log("Sử dụng userId từ currentUser:", userId);
        } else {
          console.log("Lấy userId từ API cho username:", currentUser.username);
          try {
            const response = await axios.get(
              `http://localhost:8000/api/user/${currentUser.username}`,
              {
                timeout: 5000,
              }
            );
            userId = response.data.id;
            console.log("Đã lấy được userId:", userId);

            // Cập nhật currentUser với userId
            const updatedUser = { ...currentUser, id: userId };
            AuthService.setCurrentUser(updatedUser);
          } catch (userError) {
            console.error("Không thể lấy userId:", userError);
            alert("Không thể lấy thông tin user. Vui lòng đăng nhập lại.");
            AuthService.logout();
            navigate("/");
            return;
          }
        }

        // ✅ THÊM ERROR LINES VÀO PAYLOAD
        const payload = {
          userId: userId,
          username: currentUser.username,
          originalCode: code || "",
          reviewSummary: reviewResult.feedback || reviewResult.summary || "",
          fixedCode: reviewResult.improvedCode || reviewResult.fixedCode || "",
          language: language || "unknown",
          errorLines: reviewResult.errorLines || [], // ✅ THÊM error lines
          type: type || "Re", // ✅ Thêm type cho Review
        };

        console.log("Payload gửi đi:", JSON.stringify(payload, null, 2));

        const result = await SaveService.saveReview(payload);
        console.log("✅ Lưu lịch sử thành công!", result);

        // ✅ QUAN TRỌNG: Broadcast event để các component khác biết cần refresh
        window.dispatchEvent(
          new CustomEvent("historyUpdated", {
            detail: {
              newHistoryId: result.historyId,
              username: currentUser.username,
            },
          })
        );

        // ✅ Set flag để CodeEditorPage biết cần refresh
        localStorage.setItem("history_needs_refresh", "true");
        localStorage.setItem("last_save_time", Date.now().toString());

        alert(
          "✅ Đã lưu kết quả vào lịch sử!\n\nLịch sử sẽ được cập nhật khi bạn quay lại trang chủ."
        );
      } catch (err) {
        console.error("Lỗi khi lưu lịch sử:", err);

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

        alert(`❌ ${errorMessage}\n\nVui lòng thử lại hoặc liên hệ hỗ trợ.`);
      }
    }

    // Reset và chuyển trang (luôn luôn thực hiện)
    setCode("");
    setReviewResult(null);
    navigate("/editor", { replace: true });
    console.log("=== KẾT THÚC HANDLE NEW ===");
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
