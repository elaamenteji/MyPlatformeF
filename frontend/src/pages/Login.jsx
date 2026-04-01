import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
 
const Login = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
 
  const { login } = useAuth();
  const navigate  = useNavigate();
 
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin')            navigate('/admin');
      else if (user.role === 'client')      navigate('/client');
      else if (user.role === 'fournisseur') navigate('/fournisseur');
      else                                  navigate('/partenaire');
    } catch (err) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
 
      {/* GAUCHE : Formulaire — plus large */}
      <div className="flex w-full flex-col justify-center items-center px-12 md:w-[55%] lg:px-24">
        <div className="w-full max-w-md">
 
          {/* Logo */}
          <div className="mb-10">
            <img
              src="/logo_mitech.png"
              alt="Mitech Tunisie"
              className="h-14 w-auto object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
 
          {/* Title */}
          <h1 className="text-4xl font-light text-slate-800 mb-1">Bienvenue</h1>
          <p className="text-slate-400 text-sm mb-1">Connectez-vous à votre espace personnel</p>
 
          {/* Error */}
          {error && (
            <div className="mt-3 mb-1 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
 
          <form className="mt-8 space-y-5" onSubmit={handleLogin}>
 
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="email">
                Adresse email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Mail size={17} />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="votre@mitech.tn"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-700 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white"
                />
              </div>
            </div>
 
            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                  Mot de passe
                </label>
                <span
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-slate-400 hover:text-blue-500 cursor-pointer transition-colors"
                >
                  Mot de passe oublié ?
                </span>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Lock size={17} />
                </div>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-slate-700 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
 
            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#1a1f2c] py-3.5 text-sm font-semibold text-white transition-all hover:bg-slate-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter →'}
            </button>
 
          </form>
 
          {/* Footer */}
          <p className="mt-8 text-center text-xs text-slate-400">
            🔒 Connexion sécurisée SSL · © 2026 Mitech Tunisie
          </p>
 
        </div>
      </div>
 
      {/* DROITE : Image — moins large */}
      <div className="relative hidden md:block md:w-[45%]">
        <img
          src="/car_interior.jpg"
          alt="Mitech"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 flex flex-col justify-end px-12 pb-14">
          <h2 className="text-4xl font-medium text-white leading-tight">
            Excellence<br/>& Précision
          </h2>
          <p className="mt-4 max-w-sm text-base text-slate-200 font-light leading-relaxed">
            Plateforme de gestion intégrée pour les équipes Mitech Tunisie.
          </p>
        </div>
      </div>
 
    </div>
  );
};
 
export default Login;