import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

const ReviewSection = ({ code, language, reviewResult, fixedCode, currentUser, onBack, onNew }) => {
  const [activeTab, setActiveTab] = useState("review"); // 'review' | 'fixed'

  // Helper function để render code với line numbers
  const renderCodeWithLineNumbers = (codeContent) => {
    if (!codeContent) return "Không có mã nguồn.";
    
    const lines = codeContent.split("\n");
    return (
      <div className="font-mono text-sm">
        {lines.map((line, idx) => (
          <div key={idx} className="flex">
            <span className="text-gray-400 select-none pr-4 text-right" style={{ minWidth: '3rem' }}>
              {idx + 1}
            </span>
            <span className="flex-1 whitespace-pre-wrap">{line || ' '}</span>
          </div>
        ))}
      </div>
    );
  };

  // Helper function để format review feedback
  const formatReviewFeedback = (feedback) => {
    if (!feedback) return "Đang xử lý...";
    
    // Nếu feedback có markdown format
    return (
      <div className="prose prose-sm max-w-none text-gray-800">
        <ReactMarkdown
          components={{
            // Custom rendering cho code blocks
            code: ({ node, inline, className, children, ...props }) => {
              return !inline ? (
                <pre className="bg-gray-800 text-green-400 p-3 rounded-md overflow-x-auto">
                  <code {...props}>{children}</code>
                </pre>
              ) : (
                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              );
            },
            // Custom rendering cho headers
            h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-blue-700">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-blue-600">{children}</h2>,
            h3: ({ children }) => <h3 className="text-md font-medium mb-2 text-blue-500">{children}</h3>,
            // Custom rendering cho lists
            ul: ({ children }) => <ul className="list-disc ml-4 mb-3">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal ml-4 mb-3">{children}</ol>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
          }}
        >
          {feedback}
        </ReactMarkdown>
      </div>
    );
  };

  // Lấy improved code từ reviewResult
  const getImprovedCode = () => {
    return reviewResult?.improvedCode || 
           reviewResult?.fixedCode || 
           fixedCode || 
           "⚠️ Không tìm thấy code đã cải thiện.";
  };

  // Lấy original code
  const getOriginalCode = () => {
    return reviewResult?.originalCode || code || "Không có mã nguồn gốc.";
  };

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-6">
      {/* Header với thông tin */}
      <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Quay lại chỉnh sửa</span>
          </button>
          
          {reviewResult?.isFromHistory && (
            <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Từ lịch sử: ID #{reviewResult.historyId}</span>
            </div>
          )}
        </div>
        
        <button
          onClick={onNew}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Code mới</span>
        </button>
      </div>

      {/* Bố cục 2 cột */}
      <div className="grid grid-cols-2 gap-6">
        {/* Cột trái: Code gốc */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              📄 Mã {language?.toUpperCase()} gốc
            </h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {getOriginalCode().split('\n').length} dòng
            </span>
          </div>
          
          <div className="bg-gray-50 rounded-lg overflow-auto max-h-96 p-4 border">
            {renderCodeWithLineNumbers(getOriginalCode())}
          </div>
        </div>

        {/* Cột phải: Tabs Review / Code đã sửa */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
          {/* Tabs */}
          <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("review")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "review" 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Kết quả Review</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("fixed")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "fixed" 
                  ? "bg-green-600 text-white shadow-sm" 
                  : "text-gray-600 hover:text-green-600"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Code đã cải thiện</span>
              </div>
            </button>
          </div>

          {/* Nội dung tab */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "review" && (
              <div className="h-full">
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-auto border">
                  {reviewResult ? (
                    formatReviewFeedback(reviewResult.feedback)
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-gray-500 italic">Đang phân tích code...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "fixed" && (
              <div className="h-full">
                <div className="bg-gray-50 rounded-lg max-h-96 overflow-auto p-4 border">
                  {renderCodeWithLineNumbers(getImprovedCode())}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer với thống kê */}
          {reviewResult && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="text-center">
                  <div className="font-medium text-blue-600">
                    {getOriginalCode().split('\n').length}
                  </div>
                  <div>Dòng code gốc</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-green-600">
                    {getImprovedCode().split('\n').length}
                  </div>
                  <div>Dòng code cải thiện</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewSection;