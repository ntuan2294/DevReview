import { useNavigate } from "react-router-dom";
import { useCode } from "./CodeContext";
import TestcaseSection from "./TestcaseSection";
import AuthService from "../services/AuthService";
import SaveService from "../services/SaveService";
import TestcaseService from "../services/TestcaseService";
import axios from "axios";

const TestcasePage = () => {
  const navigate = useNavigate();
  const { code, language, reviewResult, setCode, setReviewResult } = useCode();
  const currentUser = AuthService.getCurrentUser();

  const handleBack = () => navigate("/editor");

  const handleNew = async () => {
    const shouldSave =
      code &&
      currentUser &&
      currentUser.username &&
      !reviewResult?.isFromHistory &&
      window.confirm("Bạn có muốn lưu kết quả testcase này vào lịch sử không?");

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

        // ✅ Gọi TestcaseService để lấy testcases
        let testcaseText = "";
        try {
          console.log("🔄 Gọi TestcaseService để lưu...");
          const testcaseResult = await TestcaseService.generateTestcases(
            language,
            code,
            currentUser.username
          );
          
          // ✅ Lấy testcases từ response
          testcaseText = testcaseResult.testcases || 
                        testcaseResult.explanation || 
                        testcaseResult.feedback || 
                        "Không có testcase được tạo.";
                          
          console.log("✅ Lấy được testcases:", testcaseText.substring(0, 100) + "...");
        } catch (err) {
          console.error("❌ Lỗi khi gọi TestcaseService:", err);
          testcaseText = `⚠ Lỗi khi tạo testcase: ${err.message}`;
        }

        // ✅ Payload để lưu vào database
        const payload = {
          userId,
          username: currentUser.username,
          originalCode: code || "",
          reviewSummary: testcaseText, // ⚡ lưu testcases vào reviewSummary
          fixedCode: null, // ⚡ testcase không có fixed code
          language: language || "unknown",
        };

        console.log("📦 Payload để lưu:", {
          ...payload,
          reviewSummary: payload.reviewSummary.substring(0, 100) + "..." // log ngắn gọn
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

        alert("✅ Đã lưu kết quả testcase vào lịch sử!");
      } catch (err) {
        console.error("❌ Lỗi khi lưu lịch sử:", err);
        
        let errorMessage = "Không thể lưu lịch sử.";
        if (err.response) {
          errorMessage = `Lỗi server: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`;
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
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-teal-200"> {/* ✅ Màu xanh lá cho testcase */}
      <header className="bg-transparent shadow-none border-none">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1
            className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-700 via-teal-700 to-emerald-600 drop-shadow-md tracking-wide"
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

      {/* ✅ Sử dụng TestcaseSection */}
      <TestcaseSection
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

export default TestcasePage;