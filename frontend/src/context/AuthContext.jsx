import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

axios.defaults.baseURL = 'http://localhost:5000';

export const AuthProvider = ({ children }) => {

  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token     = localStorage.getItem('accessToken');

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, mot_de_passe: password });

    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;

    setUser(data.user);

    return data.user; // Login.jsx yaamel el redirect
  };

  const logout = async () => {
    const refresh = localStorage.getItem('refreshToken');
    await axios.post('/api/auth/logout', { refreshToken: refresh }).catch(() => {});
    localStorage.clear();
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);