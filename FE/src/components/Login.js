import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/AuthService";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSignIn = async () => {
    const result = await AuthService.login(username, password);

    if (result.success) {
      AuthService.setCurrentUser(result.user);
      setMessage(result.message);
      setTimeout(() => {
        navigate("/editor");
      }, 1000);
    } else {
      setMessage(result.message);
    }
  };

  const handleSignUp = async () => {
    if (isRegistering) {
      const result = await AuthService.register(username, password);
      setMessage(result.message);

      if (result.success) {
        setTimeout(() => {
          setIsRegistering(false);
          setUsername("");
          setPassword("");
          setMessage("Đăng ký thành công! Bạn có thể đăng nhập ngay.");
        }, 1500);
      }
    } else {
      setIsRegistering(true);
      setMessage("");
      setUsername("");
      setPassword("");
    }
  };

  const handleCancel = () => {
    setIsRegistering(false);
    setMessage("");
    setUsername("");
    setPassword("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200 px-4">
      <h1
        className="text-5xl text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 drop-shadow-xl tracking-wider"
        style={{
          fontFamily: '"Orbitron", sans-serif',
          marginBottom: "5rem",   // đẩy lên cao bằng cách cách xa khối đăng nhập
        }}
      >
        DEVREVIEW
      </h1>


      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-semibold text-center mb-6">
          {isRegistering ? "Đăng ký tài khoản" : "Đăng nhập"}
        </h2>

        {message && (
          <div
            className={`p-3 mb-4 rounded-lg text-center text-sm ${
              message.includes("thành công")
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-red-100 text-red-800 border border-red-300"
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Tên đăng nhập:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={
                isRegistering
                  ? "Nhập tên đăng nhập (ít nhất 3 ký tự)"
                  : "Nhập tên đăng nhập"
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mật khẩu:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                isRegistering
                  ? "Nhập mật khẩu (ít nhất 6 ký tự)"
                  : "Nhập mật khẩu"
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {isRegistering ? (
            <>
              <button
                onClick={handleSignUp}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Đăng ký
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleSignIn}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Đăng nhập
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleSignUp}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Đăng ký
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
