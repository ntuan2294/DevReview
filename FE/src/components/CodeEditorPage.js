import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCode } from "./CodeContext";
import AuthService from "../services/AuthService";
import FileService from "../services/FileService";
import FormInputSection from "./FormCodeInput";

const CodeEditorPage = () => {
  const { code, setCode, language, setLanguage, setReviewResult } = useCode();
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef(null);
  const currentUser = AuthService.getCurrentUser();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert("Vui lòng nhập code trước khi gửi!");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code,
          user: AuthService.getCurrentUser().username,
        }),
      });

      const data = await res.json();
      setReviewResult(data);
      // Navigate bình thường, không dùng replace
      navigate("/result");
    } catch (error) {
      alert("Lỗi kết nối server!");
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    navigate("/");
  };
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsProcessingFile(true);

    try {
      const result = await FileService.processFile(file);
      if (result.success) {
        const { content, language: detectedLanguage } = result.data;
        setCode(content);
        if (detectedLanguage) setLanguage(detectedLanguage);
      } else {
        alert(`Lỗi: ${result.error}`);
      }
    } catch (error) {
      alert(`Lỗi không mong muốn: ${error.message}`);
    } finally {
      setIsProcessingFile(false);
      event.target.value = "";
    }
  };

  const handleFileButtonClick = () => {
    if (isProcessingFile) return;
    fileInputRef.current?.click();
  };

  const handleNewCode = () => {
    setCode("");
    setReviewResult(null);
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
      <FormInputSection
        language={language}
        setLanguage={setLanguage}
        code={code}
        setCode={setCode}
        handleFileUpload={handleFileUpload}
        handleFileButtonClick={handleFileButtonClick}
        handleSubmit={handleSubmit}
        handleNewCode={handleNewCode}
        isProcessingFile={isProcessingFile}
        fileInputRef={fileInputRef}
        allowedExtensions={FileService.ALLOWED_EXTENSIONS}
      />
    </div>
  );
};

export default CodeEditorPage;