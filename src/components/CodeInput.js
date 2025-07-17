import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

const CodeInput = () => {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra người dùng đã đăng nhập chưa
    const user = authService.getCurrentUser();
    if (!user) {
      navigate("/");
      return;
    }
    setCurrentUser(user);
  }, [navigate]);

  // Xử lý nút back trình duyệt
  useEffect(() => {
    const handlePopState = () => {
      setSubmitted(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSubmit = () => {
    if (!code.trim()) {
      alert("Vui lòng nhập code trước khi gửi!");
      return;
    }
    // Gửi → thêm vào lịch sử để back được
    window.history.pushState(null, null);
    setSubmitted(true);
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("Bạn có chắc chắn muốn đăng xuất?");
    if (confirmLogout) {
      authService.logout();
      navigate("/");
    }
  };

  const handleNewCode = () => {
    setCode("");
    setSubmitted(false);
  };

  const languages = ["python", "javascript", "cpp", "java", "html", "css"];

  if (!currentUser) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header với thông tin user */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Code Editor</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Xin chào, <span className="font-medium">{currentUser.username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {!submitted ? (
          <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-6 space-y-4">
            {/* Chọn ngôn ngữ */}
            <div className="flex items-center space-x-3">
              <label htmlFor="language" className="font-medium text-gray-700">
                Ngôn ngữ:
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Nhập code */}
            <textarea
              rows={18}
              placeholder="Nhập code tại đây..."
              className="w-full font-mono text-sm border border-gray-300 rounded-lg p-4 resize-none focus:outline-none focus:ring focus:border-blue-400"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            ></textarea>

            {/* Nút gửi */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleNewCode}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                Xóa
              </button>
              <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Gửi
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Nút quay lại */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setSubmitted(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                ← Quay lại chỉnh sửa
              </button>
              <button
                onClick={handleNewCode}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Code mới
              </button>
            </div>

            {/* Màn hình chia đôi */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold mb-2">
                  Mã {language.toUpperCase()} bạn đã nhập:
                </h2>
                <pre className="bg-gray-100 text-sm p-4 rounded-lg overflow-auto whitespace-pre-wrap max-h-96">
                  {code}
                </pre>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold mb-2">Kết quả / Xử lý thêm:</h2>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-gray-500 italic mb-2">Chưa có nội dung xử lý</p>
                  <div className="text-sm text-gray-400">
                    <p>• Ngôn ngữ: {language.toUpperCase()}</p>
                    <p>• Số dòng: {code.split('\n').length}</p>
                    <p>• Số ký tự: {code.length}</p>
                    <p>• Người dùng: {currentUser.username}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeInput;