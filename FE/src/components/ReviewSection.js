
import ReactMarkdown from "react-markdown";

const ReviewSection = ({ code, language, reviewResult, currentUser, onBack, onNew }) => {

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-2">Mã {language.toUpperCase()} bạn đã nhập:</h2>
          <pre className="bg-gray-100 text-sm p-4 rounded-lg overflow-auto whitespace-pre-wrap max-h-96">
            {code}
          </pre>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-2">Kết quả Review:</h2>
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-auto">
            {reviewResult ? (
              <div className="prose prose-sm max-w-none text-gray-800">
                <ReactMarkdown>{reviewResult.feedback}</ReactMarkdown>
            </div>
            ) : (
              <p className="text-gray-500 italic mb-2">Đang xử lý...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSection;
