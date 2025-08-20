import React from "react";
import { useNavigate } from "react-router-dom";
import { useCode } from "./CodeContext";
import ReviewSection from "./ReviewSection";
import AuthService from "../services/AuthService";
import SaveService from "../services/SaveService";
import axios from "axios"; // Thêm import axios

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

    // Hỏi user có muốn lưu không (nếu có dữ liệu)
    const shouldSave = reviewResult && currentUser && currentUser.username && 
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
            // Sử dụng axios thay vì fetch để consistent với các service khác
            const response = await axios.get(`http://localhost:8000/api/user/${currentUser.username}`, {
              timeout: 5000
            });
            userId = response.data.id;
            console.log("Đã lấy được userId:", userId);
          } catch (userError) {
            console.error("Không thể lấy userId:", userError);
            
            // Xử lý các loại lỗi khác nhau
            let errorMessage = "Không thể kết nối với server";
            
            if (userError.code === 'ECONNREFUSED') {
              errorMessage = "Backend server không chạy (port 8000)";
            } else if (userError.response?.status === 404) {
              errorMessage = `User '${currentUser.username}' không tồn tại trong hệ thống`;
            } else if (userError.code === 'ECONNABORTED') {
              errorMessage = "Kết nối bị timeout";
            }
            
            alert(`${errorMessage}\nDữ liệu sẽ không được lưu.`);
            // Vẫn cho phép tiếp tục mà không lưu
          }
        }

        // Chỉ lưu nếu có userId
        if (userId) {
          const payload = {
            userId: userId,
            username: currentUser.username,
            originalCode: code || "",
            reviewSummary: reviewResult.feedback || reviewResult.summary || "",
            fixedCode: reviewResult.improvedCode || reviewResult.fixedCode || ""
          };
          
          console.log("Payload gửi đi:", JSON.stringify(payload, null, 2));
          
          // Gửi request với timeout
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Request timeout")), 10000)
          );
          
          const savePromise = SaveService.saveReview(payload);
          
          const result = await Promise.race([savePromise, timeoutPromise]);
          console.log("Lưu lịch sử thành công!", result);
          alert("Đã lưu kết quả vào lịch sử!");
        }
        
      } catch (err) {
        console.error("Lỗi khi lưu lịch sử:", err);
        
        // Hiển thị lỗi nhưng vẫn cho phép tiếp tục
        let errorMessage = "Không thể lưu lịch sử.";
        
        if (err.message === "Request timeout") {
          errorMessage = "Lưu lịch sử mất quá nhiều thời gian.";
        } else if (err.response) {
          errorMessage = `Lỗi server: ${err.response.status}`;
        } else if (err.message) {
          errorMessage = `Lỗi: ${err.message}`;
        }
        
        alert(`${errorMessage}\nBạn vẫn có thể tiếp tục sử dụng ứng dụng.`);
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