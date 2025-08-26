import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import SuggestNameService from "../services/SuggestNameService";

const SuggestSection = ({ code, language, currentUser, onBack, onNew }) => {
  const [suggestions, setSuggestions] = useState(null);
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

  // Format suggestions với style riêng cho suggest
  const formatSuggestions = (text) => {
    if (!text) return "Đang xử lý...";
    return (
      <div className="prose prose-sm max-w-none text-gray-800">
        <ReactMarkdown
          components={{
            code: ({ inline, children, ...props }) =>
              !inline ? (
                <pre className="bg-orange-900 text-orange-200 p-3 rounded-lg overflow-x-auto shadow-inner">
                  <code {...props}>{children}</code>
                </pre>
              ) : (
                <code className="bg-orange-200 text-orange-900 px-1 py-0.5 rounded text-sm">
                  {children}
                </code>
              ),
            h1: ({ children }) => (
              <h1 className="text-xl font-bold mb-3 text-orange-700">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold mb-2 text-orange-600">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-md font-medium mb-2 text-orange-500">
                {children}
              </h3>
            ),
            ul: ({ children }) => (
              <ul className="list-disc ml-4 mb-3 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal ml-4 mb-3 space-y-1">{children}</ol>
            ),
            li: ({ children }) => <li className="text-gray-700">{children}</li>,
            strong: ({ children }) => (
              <strong className="font-semibold text-orange-800">
                {children}
              </strong>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  };

  // ✅ Gọi SuggestName API khi code thay đổi
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!code || !code.trim()) {
        setSuggestions("⚠️ Không có code để gợi ý tên.");
        setLoading(false);
        setError(null);
        return;
      }

      if (!language) {
        setSuggestions("⚠️ Vui lòng chọn ngôn ngữ lập trình.");
        setLoading(false);
        setError(null);
        return;
      }

      console.log("🔄 Bắt đầu gọi SuggestName API...");
      setLoading(true);
      setError(null);

      try {
        const result = await SuggestNameService.suggestNames(
          language,
          code,
          currentUser?.username || "anonymous"
        );

        console.log("📦 Kết quả từ API:", result);

        // ✅ Xử lý response từ backend
        if (result.suggestions) {
          setSuggestions(result.suggestions);
        } else if (result.explanation) {
          // fallback
          setSuggestions(result.explanation);
        } else if (result.feedback) {
          // fallback khác
          setSuggestions(result.feedback);
        } else {
          setSuggestions("🤔 API trả về dữ liệu nhưng không có gợi ý cụ thể.");
        }
      } catch (error) {
        console.error("❌ Lỗi khi fetch suggestions:", error);
        setError(error.message);
        setSuggestions(
          `❌ **Lỗi khi gọi API gợi ý tên:**\n\n${error.message}\n\n` +
            `Vui lòng:\n` +
            `- Kiểm tra kết nối mạng\n` +
            `- Đảm bảo backend đang chạy\n` +
            `- Thử lại sau ít phút`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [code, language, currentUser?.username]);

  // ✅ Loading state với thông tin chi tiết hơn
  const renderLoadingState = () => (
    <div className="flex items-center justify-center h-40">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-orange-600 font-medium">Đang phân tích code...</p>
        <p className="text-xs text-gray-500 mt-1">
          Gợi ý tên cho ngôn ngữ {language?.toUpperCase()}
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
        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
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
              <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded">
                {language?.toUpperCase() || "N/A"}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg overflow-auto max-h-[500px] p-4 border">
            {renderCodeWithLineNumbers(code)}
          </div>
        </div>

        {/* Right: Suggestions */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <span>🏷️</span>
            <span>Gợi ý tên hàm & biến</span>
          </h2>

          <div className="bg-orange-50 border border-orange-200 rounded-lg flex-1 overflow-hidden">
            {loading ? (
              renderLoadingState()
            ) : error ? (
              renderErrorState()
            ) : (
              <div className="p-4 overflow-auto max-h-[500px]">
                {formatSuggestions(suggestions)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestSection;
