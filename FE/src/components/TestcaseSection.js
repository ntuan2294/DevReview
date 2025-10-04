import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import TestcaseService from "../services/TestcaseService";

const TestcaseSection = ({ code, language, currentUser, onBack, onNew }) => {
  const [testcases, setTestcases] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Render code with line numbers
  const renderCodeWithLineNumbers = (codeContent) => {
    if (!codeContent) return "Không có mã nguồn.";
    const lines = codeContent.split("\n");
    return (
      <div className="font-mono text-sm">
        {lines.map((line, idx) => (
          <div key={idx} className="flex">
            <span
              className="text-gray-400 select-none pr-4 text-right"
              style={{ minWidth: "3rem" }}
            >
              {idx + 1}
            </span>
            <span className="flex-1 whitespace-pre-wrap">{line || " "}</span>
          </div>
        ))}
      </div>
    );
  };

  // Format testcases với style riêng cho testcase
  const formatTestcases = (text) => {
    if (!text) return "Đang xử lý...";
    return (
      <div className="prose prose-sm max-w-none text-gray-800">
        <ReactMarkdown
          components={{
            code: ({ inline, children, ...props }) =>
              !inline ? (
                <pre className="bg-green-900 text-green-200 p-3 rounded-lg overflow-x-auto shadow-inner">
                  <code {...props}>{children}</code>
                </pre>
              ) : (
                <code className="bg-green-200 text-green-900 px-1 py-0.5 rounded text-sm">
                  {children}
                </code>
              ),
            h1: ({ children }) => (
              <h1 className="text-xl font-bold mb-3 text-green-700">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold mb-2 text-green-600">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-md font-medium mb-2 text-green-500">
                {children}
              </h3>
            ),
            ul: ({ children }) => (
              <ul className="list-disc ml-4 mb-3 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal ml-4 mb-3 space-y-1">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-gray-700">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-green-800">{children}</strong>
            ),
            // ✅ Thêm style đặc biệt cho testcase
            table: ({ children }) => (
              <table className="border-collapse border border-green-300 w-full mb-4">
                {children}
              </table>
            ),
            th: ({ children }) => (
              <th className="border border-green-300 bg-green-100 px-2 py-1 text-left">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-green-300 px-2 py-1">
                {children}
              </td>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  };

  // ✅ Gọi Testcase API khi code thay đổi
  useEffect(() => {
    const fetchTestcases = async () => {
      if (!code || !code.trim()) {
        setTestcases("⚠️ Không có code để sinh testcase.");
        setLoading(false);
        setError(null);
        return;
      }

      if (!language) {
        setTestcases("⚠️ Vui lòng chọn ngôn ngữ lập trình.");
        setLoading(false);
        setError(null);
        return;
      }

      console.log("🔄 Bắt đầu gọi Testcase API...");
      setLoading(true);
      setError(null);

      try {
        const result = await TestcaseService.generateTestcases(
          language,
          code,
          currentUser?.username || "anonymous"
        );

        console.log("📦 Kết quả từ API:", result);

        // ✅ Xử lý response từ backend
        if (result.testcases) {
          setTestcases(result.testcases);
        } else if (result.explanation) { // fallback
          setTestcases(result.explanation);
        } else if (result.feedback) { // fallback khác
          setTestcases(result.feedback);
        } else {
          setTestcases("🤔 API trả về dữ liệu nhưng không có testcase cụ thể.");
        }

      } catch (error) {
        console.error("❌ Lỗi khi fetch testcases:", error);
        setError(error.message);
        setTestcases(
          `❌ **Lỗi khi gọi API sinh testcase:**\n\n${error.message}\n\n` +
          `Vui lòng:\n` +
          `- Kiểm tra kết nối mạng\n` +
          `- Đảm bảo backend đang chạy\n` +
          `- Thử lại sau ít phút`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTestcases();
  }, [code, language, currentUser?.username]);

  // ✅ Loading state với thông tin chi tiết hơn
  const renderLoadingState = () => (
    <div className="flex items-center justify-center h-40">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-green-600 font-medium">Đang tạo testcase...</p>
        <p className="text-xs text-gray-500 mt-1">
          Phân tích {language?.toUpperCase()} và tạo test cases
        </p>
      </div>
    </div>
  );

  // ✅ Error state với retry button
  const renderErrorState = () => (
    <div className="text-center p-6">
      <div className="text-red-500 text-4xl mb-4">⚠️</div>
      <div className="text-red-700 font-semibold mb-2">Có lỗi xảy ra</div>
      <div className="text-sm text-gray-600 mb-4">{error}</div>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
      >
        🔄 Thử lại
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>Quay lại chỉnh sửa</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Status indicator */}
          {loading && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm">
              <div className="animate-spin w-3 h-3 border border-green-600 border-t-transparent rounded-full"></div>
              <span>Đang xử lý...</span>
            </div>
          )}
          
          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-100 px-3 py-1 rounded-full text-sm">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Có lỗi</span>
            </div>
          )}

          {!loading && !error && testcases && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Hoàn thành</span>
            </div>
          )}

          <button
            onClick={onNew}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Code mới</span>
          </button>
        </div>
      </div>

      {/* Content: 2 columns */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Code */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <span>📄</span>
              <span>Mã {language?.toUpperCase()} gốc</span>
            </h2>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {code?.split("\n").length || 0} dòng
              </span>
              <span className="text-green-600 bg-green-100 px-2 py-1 rounded">
                {language?.toUpperCase() || "N/A"}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg overflow-auto max-h-[500px] p-4 border">
            {renderCodeWithLineNumbers(code)}
          </div>
        </div>

        {/* Right: Testcases */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <span>🧪</span>
            <span>Test Cases đã tạo</span>
          </h2>
          
          <div className="bg-green-50 border border-green-200 rounded-lg flex-1 overflow-hidden">
            {loading ? (
              renderLoadingState()
            ) : error ? (
              renderErrorState()
            ) : (
              <div className="p-4 overflow-auto max-h-[500px]">
                {formatTestcases(testcases)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestcaseSection;