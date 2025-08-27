import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HistoryService from "../services/HistoryService";
import { useCode } from "./CodeContext";

const FormCodeInput = ({ code, setCode }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    setReviewResult,
    historyItems,
    setHistoryItems,
    isLoadingHistory,
    setIsLoadingHistory,
  } = useCode();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // ✅ Chỉ fetch nếu chưa có historyItems hoặc đang loading
        if (historyItems.length > 0 && !isLoadingHistory) {
          return; // Không cần fetch nếu đã có data
        }

        setLoading(true);
        setIsLoadingHistory(true);

        // ✅ Sử dụng username từ localStorage hoặc context
        const username = localStorage.getItem("username") || "default";
        const response = await HistoryService.getHistory(username);
        setHistoryItems(response.data || []);
      } catch (err) {
        console.error("Lỗi khi load lịch sử:", err);
        setHistoryItems([]);
      } finally {
        setLoading(false);
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [
    historyItems.length,
    isLoadingHistory,
    setHistoryItems,
    setIsLoadingHistory,
  ]);

  const handleHistoryClick = async (id) => {
    try {
      const response = await HistoryService.getHistoryDetail(id);
      setReviewResult(response.data);
      navigate("/result");
    } catch (err) {
      console.error("Không lấy được chi tiết lịch sử:", err);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-6">
      <div className="col-span-3">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Nhập code tại đây..."
          className="w-full h-96 border rounded p-3"
        />
      </div>
      <div className="col-span-1 border-l pl-4">
        <h3 className="font-semibold mb-2">Lịch sử</h3>
        {loading ? (
          <div className="text-center py-4">Đang tải...</div>
        ) : (
          <ul className="divide-y">
            {historyItems.length > 0 ? (
              historyItems.map((item) => (
                <li
                  key={item.id}
                  className="p-3 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleHistoryClick(item.id)}
                >
                  <div className="text-sm font-medium">
                    {item.language
                      ? `Review ${item.language.toUpperCase()}`
                      : "Review Code"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("vi-VN")
                      : ""}
                  </div>
                </li>
              ))
            ) : (
              <li className="p-3 text-gray-500 text-sm">Chưa có lịch sử</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FormCodeInput;
