import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

const ReviewSection = ({ code, language, reviewResult, fixedCode, currentUser, onBack, onNew }) => {
  const [activeTab, setActiveTab] = useState("review"); // 'review' | 'fixed'

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Nút điều hướng */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
        >
          Quay lại chỉnh sửa
        </button>
        <button
          onClick={onNew}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Code mới
        </button>
      </div>

      {/* Bố cục 2 cột */}
      <div className="grid grid-cols-2 gap-4">
        {/* Cột trái: Code gốc */}
<div className="bg-white rounded-xl shadow-md p-6">
  <h2 className="text-lg font-semibold mb-2">
    Mã {language.toUpperCase()} bạn đã nhập:
  </h2>
  <pre className="bg-gray-100 text-sm p-4 rounded-lg overflow-auto whitespace-pre-wrap max-h-96">
    {(() => {
      if (!code) return "Không có mã nguồn.";

      const lines = code.split("\n");
      return lines.map((line, idx) => (
        <div
          key={idx}
          style={idx === 4 ? { backgroundColor: "yellow" } : {}}
        >
          {line}
        </div>
      ));
    })()}
  </pre>
</div>


        {/* Cột phải: Tabs Review / Code đã sửa */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
          {/* Tabs */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setActiveTab("review")}
              className={`px-4 py-2 rounded ${activeTab === "review" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              Kết quả Review
            </button>
            <button
              onClick={() => setActiveTab("fixed")}
              className={`px-4 py-2 rounded ${activeTab === "fixed" ? "bg-green-600 text-white" : "bg-gray-200"}`}
            >
              Code đã sửa
            </button>
          </div>

          {/* Nội dung tab */}
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-auto flex-1">
            {activeTab === "review" && (
              reviewResult ? (
                <div className="prose prose-sm max-w-none text-gray-800">
                  <ReactMarkdown>{reviewResult.feedback}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-gray-500 italic">Đang xử lý...</p>
              )
            )}

            {activeTab === "fixed" && (
              <pre className="bg-gray-100 text-sm p-4 rounded-lg overflow-auto whitespace-pre-wrap max-h-96">
              {reviewResult?.improvedCode || "Chưa có code đã sửa."}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSection;
