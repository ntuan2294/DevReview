import React, { useState, useEffect } from "react";

const CodeInput = () => {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Xử lý nút back trình duyệt
  useEffect(() => {
    const handlePopState = () => {
      setSubmitted(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSubmit = () => {
    // Gửi → thêm vào lịch sử để back được
    window.history.pushState(null, null);
    setSubmitted(true);
  };


  const languages = ["python", "javascript", "cpp", "java", "html", "css"];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
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
                  {lang}
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
          <div className="flex justify-end">
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
          {/* Màn hình chia đôi */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-2">Mã bạn đã nhập:</h2>
              <pre className="bg-gray-100 text-sm p-4 rounded-lg overflow-auto whitespace-pre-wrap"> {code}
              </pre>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-2">Kết quả / Xử lý thêm:</h2>
              <div className="text-gray-500 italic">Chưa có nội dung</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeInput;
