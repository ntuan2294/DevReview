import axios from 'axios';

class AccountManager {
  constructor() {
    this.currentUser = null;
    this.initializeAuth();
  }

  initializeAuth() {
    try {
      const savedUser = sessionStorage.getItem('current_user');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }
    } catch (error) {
      console.error('Auth init error:', error);
    }
  }

  async login(username, password) {
    try {
      const res = await axios.post('http://localhost:8000/api/login', {
        username,
        password
      });
      return res.data;
    } catch (error) {
      return { success: false, message: 'Lỗi kết nối server!' };
    }
  }

  async register(username, password) {
    try {
      const res = await axios.post('http://localhost:8000/api/register', {
        username,
        password
      });
      return res.data;
    } catch (error) {
      return { success: false, message: 'Lỗi kết nối server!' };
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  setCurrentUser(user) {
    this.currentUser = user;
    sessionStorage.setItem('current_user', JSON.stringify(user));
  }

  logout() {
    this.currentUser = null;
    sessionStorage.removeItem('current_user');
  }

  async getAllAccounts() {
    try {
      const res = await axios.get('http://localhost:8000/api/accounts');
      return res.data;
    } catch (error) {
      console.error('Get accounts error:', error);
      return [];
    }
  }
}

const accountManager = new AccountManager();
export default accountManager;

