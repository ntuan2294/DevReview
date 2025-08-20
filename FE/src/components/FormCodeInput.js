import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HistoryService from "../services/HistoryService";
import { useCode } from "./CodeContext";

const FormCodeInput = ({ code, setCode }) => {
  const [historyItems, setHistoryItems] = useState([]);
  const navigate = useNavigate();
  const { setReviewResult } = useCode();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await HistoryService.getHistory();
        setHistoryItems(data);
      } catch (err) {
        console.error("Lỗi khi load lịch sử:", err);
      }
    };
    fetchHistory();
  }, []);

  const handleHistoryClick = async (id) => {
    try {
      const detail = await HistoryService.getHistoryDetail(id);
      setReviewResult(detail); 
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
        <ul className="divide-y">
          {historyItems.map((item) => (
            <li
              key={item.id}
              className="p-3 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleHistoryClick(item.id)}
            >
              {item.summary || `Review ${item.language}`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FormCodeInput;
