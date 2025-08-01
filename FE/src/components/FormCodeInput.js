
const FormInputSection = ({
  language,
  setLanguage,
  code,
  setCode,
  handleFileUpload,
  handleFileButtonClick,
  handleSubmit,
  handleNewCode,
  isProcessingFile,
  fileInputRef,
  allowedExtensions,
}) => {
  const languages = ["python", "javascript", "cpp", "java", "html", "css"];

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-6 space-y-4">
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

      <textarea
        rows={18}
        placeholder="Nhập code tại đây..."
        className="w-full font-mono text-sm border border-gray-300 rounded-lg p-4 resize-none focus:outline-none focus:ring focus:border-blue-400"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      ></textarea>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept={allowedExtensions.map((ext) => `.${ext}`).join(",")}
        style={{ display: "none" }}
      />

      <div className="flex justify-end space-x-3">
        <button
          onClick={handleNewCode}
          className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
        >
          Xóa
        </button>
        <button
          onClick={handleFileButtonClick}
          disabled={isProcessingFile}
          className={`px-6 py-2 rounded-lg transition flex items-center space-x-2 ${
            isProcessingFile
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          } text-white`}
        >
          {isProcessingFile ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Đang xử lý...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Gửi file</span>
            </>
          )}
        </button>
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span>Gửi</span>
        </button>
      </div>
    </div>
  );
};

export default FormInputSection;
