// src/services/authService.js
class AuthService {
  constructor() {
    this.STORAGE_KEY = 'user_accounts';
    this.initializeStorage();
  }

  // Khởi tạo storage nếu chưa có
  initializeStorage() {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    }
  }

  // Lấy tất cả tài khoản
  getAllAccounts() {
    const accounts = localStorage.getItem(this.STORAGE_KEY);
    return accounts ? JSON.parse(accounts) : [];
  }

  // Lưu tài khoản mới
  saveAccount(username, password) {
    const accounts = this.getAllAccounts();
    const newAccount = {
      id: Date.now(),
      username,
      password,
      createdAt: new Date().toISOString()
    };
    accounts.push(newAccount);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(accounts));
    return newAccount;
  }

  // Kiểm tra tài khoản có tồn tại không
  accountExists(username) {
    const accounts = this.getAllAccounts();
    return accounts.some(account => account.username === username);
  }

  // Xác thực đăng nhập
  authenticate(username, password) {
    const accounts = this.getAllAccounts();
    const account = accounts.find(
      acc => acc.username === username && acc.password === password
    );
    return account || null;
  }

  // Đăng ký tài khoản mới
  register(username, password) {
    if (!username || !password) {
      return { success: false, message: 'Vui lòng nhập đầy đủ thông tin!' };
    }

    if (username.length < 3) {
      return { success: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' };
    }

    if (password.length < 6) {
      return { success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự!' };
    }

    if (this.accountExists(username)) {
      return { success: false, message: 'Tên đăng nhập đã tồn tại!' };
    }

    const newAccount = this.saveAccount(username, password);
    return { 
      success: true, 
      message: 'Đăng ký thành công!',
      account: newAccount 
    };
  }

  // Đăng nhập
  login(username, password) {
    if (!username || !password) {
      return { success: false, message: 'Vui lòng nhập đầy đủ thông tin!' };
    }

    const account = this.authenticate(username, password);
    if (account) {
      return { 
        success: true, 
        message: 'Đăng nhập thành công!',
        account 
      };
    }

    return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng!' };
  }

  // Lấy thông tin tài khoản hiện tại (từ session)
  getCurrentUser() {
    const currentUser = sessionStorage.getItem('current_user');
    return currentUser ? JSON.parse(currentUser) : null;
  }

  // Lưu thông tin tài khoản hiện tại vào session
  setCurrentUser(account) {
    sessionStorage.setItem('current_user', JSON.stringify(account));
  }

  // Đăng xuất
  logout() {
    sessionStorage.removeItem('current_user');
  }
}

export default new AuthService();