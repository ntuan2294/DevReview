import React, { useState, useEffect } from "react";
import authService from "../services/authService";

const AccountManager = () => {
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    const allAccounts = authService.getAllAccounts();
    setAccounts(allAccounts);
  };

  const handleDeleteAccount = (accountId) => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa tài khoản này?");
    if (confirmDelete) {
      const allAccounts = authService.getAllAccounts();
      const updatedAccounts = allAccounts.filter(account => account.id !== accountId);
      localStorage.setItem('user_accounts', JSON.stringify(updatedAccounts));
      loadAccounts();
    }
  };

  const filteredAccounts = accounts.filter(account =>
    account.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Quản lý tài khoản</h1>

      {/* Tìm kiếm */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên đăng nhập..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">Tổng tài khoản</h3>
          <p className="text-2xl font-bold text-blue-600">{accounts.length}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">Kết quả tìm kiếm</h3>
          <p className="text-2xl font-bold text-green-600">{filteredAccounts.length}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">Mới nhất</h3>
          <p className="text-sm text-purple-600">
            {accounts.length > 0 ? formatDate(accounts[accounts.length - 1].createdAt) : "Chưa có"}
          </p>
        </div>
      </div>

      {/* Danh sách tài khoản */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên đăng nhập
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  {searchTerm ? "Không tìm thấy tài khoản nào" : "Chưa có tài khoản nào"}
                </td>
              </tr>
            ) : (
              filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {account.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {account.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(account.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded transition-colors"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Hướng dẫn */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Lưu ý:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Dữ liệu được lưu trữ trong localStorage của trình duyệt</li>
          <li>• Xóa dữ liệu trình duyệt sẽ mất toàn bộ tài khoản</li>
          <li>• Trong môi trường thực tế, nên sử dụng database thay vì localStorage</li>
        </ul>
      </div>
    </div>
  );
};

export default AccountManager;