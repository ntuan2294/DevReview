import React from "react";
import { useNavigate } from "react-router-dom";
import { useCode } from "./CodeContext";
import ReviewSection from "./ReviewSection";
import AuthService from "../services/AuthService";
import SaveService from "../services/SaveService";

const CodeResultPage = () => {
  const navigate = useNavigate();
  const { code, language, reviewResult, setCode, setReviewResult } = useCode();
  const currentUser = AuthService.getCurrentUser();

  // Quay lại trang editor
  const handleBack = () => navigate("/editor");
  
  const handleNew = async () => {
    console.log("=== BẮT ĐẦU HANDLE NEW ===");
    console.log("Current user:", currentUser);
    console.log("Review result:", reviewResult);

    // Bắt đầu lưu lịch sử
    if (reviewResult && currentUser && currentUser.username) {
      try {
        let userId;
        
        // Nếu currentUser có id thì dùng, không thì lấy từ API
        if (currentUser.id) {
          userId = currentUser.id;
          console.log("Sử dụng userId từ currentUser:", userId);
        } else {
          console.log("Lấy userId từ API cho username:", currentUser.username);
          userId = await AuthService.getUserId(currentUser.username);
          console.log("Đã lấy được userId:", userId);
        }

        const payload = {
          userId: userId,
          originalCode: code || "",
          reviewSummary: reviewResult.feedback || reviewResult.summary || "",
          fixedCode: reviewResult.improvedCode || reviewResult.fixedCode || ""
        };
        
        console.log("Payload gửi đi:", JSON.stringify(payload, null, 2));
        
        // Đợi yêu cầu lưu hoàn thành trước khi tiếp tục
        const result = await SaveService.saveReview(payload);
        console.log("Lưu lịch sử thành công!", result);
        
      } catch (err) {
        console.error("Không thể lưu lịch sử:", err);
        alert("Có lỗi xảy ra khi lưu lịch sử. Vui lòng thử lại!");
        return;
      }
    } else {
      console.warn("Thiếu dữ liệu để lưu:", { 
        hasReviewResult: !!reviewResult, 
        hasCurrentUser: !!currentUser,
        username: currentUser?.username
      });
    }

    // Sau khi lưu thành công, mới xóa dữ liệu và chuyển hướng
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