import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();


axios.defaults.baseURL = 'http://localhost:5000';

export const AuthProvider = ({ children }) => {

  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [token,   setToken]   = useState(localStorage.getItem('accessToken'));

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('accessToken');

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
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
    setToken(data.accessToken);

    return data.user; // Login.jsx yaamel el redirect
  };

  const logout = async () => {
    const refresh = localStorage.getItem('refreshToken');
    await axios.post('/api/auth/logout', { refreshToken: refresh }).catch(() => {});
    localStorage.clear();
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
  };

 return (
  <AuthContext.Provider value={{ user, loading, login, logout, token }}>
    {children}
  </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);