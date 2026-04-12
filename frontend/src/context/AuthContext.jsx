// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AuthContext.jsx — El Dhakira mte3 el Site
// Yib9a 3aref shkoun connecté fil kol el site
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. Import React tools eli nesta3mlou
import { createContext, useContext, useState, useEffect } from 'react';

// 2. Import Axios — el garçon eli ywassel Frontend bel Backend
import axios from 'axios';

// 3. Esna3 el "Khzana" — el blassa eli yet7ot fiha kol haja
const AuthContext = createContext();

// 4. 3onwen el Backend — mch nkattbou kol mra http://localhost:5000
axios.defaults.baseURL = 'http://localhost:5000';

export const AuthProvider = ({ children }) => {

  // 5. El States — ardoise el page
  // user    = shkoun connecté (Ahmed, role: client) — null = 7add mch connecté
  // loading = baqi ycharrek wella la
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // 6. Ki el page tetchagger — ychek localStorage
  // Ya3ni: ki Ahmed yrefreshi el page → yib9a connecté
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token     = localStorage.getItem('accessToken');

    if (savedUser && token) {
      // La9a token → y7ot el user fil dhakira
      setUser(JSON.parse(savedUser));
      // Y9oul lel Axios: "dima b3ath el token ma3 kol request"
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    // Kamel el check → el site yban
    setLoading(false);
  }, []);

  // 7. login() — ki user yclicki "Se connecter"
  // Ykallem el backend → yrod token → y7otou fil localStorage
  const login = async (email, password) => {

    // Yb3ath email + password lel backend
    const { data } = await axios.post('/api/auth/login', { email, mot_de_passe: password });

    // Y7ot token fil localStorage (yib9a 7atta ki yrefreshi)
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user',         JSON.stringify(data.user));

    // Y9oul lel Axios: "b3ath el token ma3 kol request ba3d"
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;

    // Y7ot el user fil dhakira → kol el site ya3raf eli connecté
    setUser(data.user);

    // Yrod el user bech Login.jsx yaaml el redirect
    return data.user;
  };

  // 8. logout() — ki user yclicki "Déconnexion"
  // Yamsah kol haja → user yet9ata3
  const logout = async () => {
    const refresh = localStorage.getItem('refreshToken');

    // Yb3ath lel backend bech yamsah el token men DB
    await axios.post('/api/auth/logout', { refreshToken: refresh }).catch(() => {});

    // Yamsah localStorage → token mch baqi
    localStorage.clear();

    // Yamsah el token mel Axios
    delete axios.defaults.headers.common['Authorization'];

    // Yamsah el user mel dhakira → kol el site ya3raf eli mch connecté
    setUser(null);
  };

  // 9. Provider — ywassel kol haja lel kol el site
  // Kol page tnajem testa3mel: user, loading, login, logout
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 10. useAuth — el mfta7 bech tjib kol haja mel AuthContext
// Testa3mlou f kol page: const { login, user } = useAuth()
export const useAuth = () => useContext(AuthContext);