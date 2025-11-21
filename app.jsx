import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  updateDoc,
  setDoc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { 
  Store, ShoppingBag, Plus, Trash2, LogOut, ExternalLink, 
  CreditCard, X, LayoutDashboard, ChevronRight, Image as ImageIcon, 
  DollarSign, Package, MessageCircle, Settings, Star, Palette, PieChart,
  TrendingUp, ShieldCheck, ArrowRight, Banknote, Wallet, CheckCircle2,
  Lock, Unlock, User, Truck, Dog, Copy
} from 'lucide-react';

// --- Configuração do Firebase (Seus Dados Reais) ---
const firebaseConfig = {
  apiKey: "AIzaSyDvAcCedeELaoqybw64-DqZboSvtZqjH04",
  authDomain: "lojinic-99d2e.firebaseapp.com",
  projectId: "lojinic-99d2e",
  storageBucket: "lojinic-99d2e.firebasestorage.app",
  messagingSenderId: "170010365264",
  appId: "1:170010365264:web:94e1b369cd38ab9ed2b055",
  measurementId: "G-0WY10W9CLN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Define um ID fixo para produção para organizar seus dados no Firestore
const appId = 'lojinic-producao'; 

// --- Utilitários ---
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getRandomProductImage = (keyword = 'product') => `https://source.unsplash.com/featured/?${keyword},shopping&t=${Date.now()}`;
const getUiAvatar = (name, color = '0f172a') => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color.replace('#', '')}&color=fff&size=128&bold=true&font-size=0.33`;

// --- Variáveis de Estilo e Marca (Extraídas da Logo do Pitbull) ---
const BRAND_BLUE_DARK = '#263238'; // Cinza Chumbo (Pescoço)
const BRAND_BLUE_LIGHT = '#546E7A'; // Azul Slate (Cabeça)
const LOGO_IMAGE_URL = "https://i.imgur.com/70z9K9S.jpeg"; 

// --- Componente Principal ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState('landing');
  const [currentStoreId, setCurrentStoreId] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // 1. Monitora o estado de autenticação
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });

    // 2. Verifica se há um link direto para uma loja (?store=ID)
    const params = new URLSearchParams(window.location.search);
    const storeIdFromUrl = params.get('store');
    if (storeIdFromUrl) {
      setCurrentStoreId(storeIdFromUrl);
      setView('storefront');
    }

    return () => unsubscribe();
  }, []);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000); 
  };

  // Navegação com Atualização de URL (Deep Linking)
  const navigateToStore = (storeId) => {
    setCurrentStoreId(storeId);
    setView('storefront');
    // Atualiza a URL sem recarregar a página para permitir compartilhamento
    const newUrl = `${window.location.pathname}?store=${storeId}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const navigateHome = () => {
    setView('landing');
    setCurrentStoreId(null);
    // Limpa a URL
    window.history.pushState({ path: window.location.pathname }, '', window.location.pathname);
  };

  if (authLoading) return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-800"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-lg shadow-2xl text-white text-sm font-medium animate-fade-in-down flex items-center gap-3 ${notification.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {notification.type === 'success' ? <CheckCircle2 size={18}/> : <X size={18}/>}
          {notification.msg}
        </div>
      )}

      {view === 'landing' && <LandingPage setView={setView} user={user} />}
      {view === 'login' && <AuthForm type="login" setView={setView} notify={notify} navigateHome={navigateHome}/>}
      {view === 'register' && <AuthForm type="register" setView={setView} notify={notify} navigateHome={navigateHome}/>}
      {view === 'dashboard' && user && <Dashboard user={user} setView={setView} notify={notify} navigateToStore={navigateToStore} navigateHome={navigateHome} />}
      {view === 'storefront' && currentStoreId && <Storefront storeId={currentStoreId} setView={setView} notify={notify} navigateHome={navigateHome} />}
      {view === 'all-stores' && <AllStoresList setView={setView} navigateToStore={navigateToStore} navigateHome={navigateHome} />}
    </div>
  );
}

// --- 1. Landing Page ---
function LandingPage({ setView, user }) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
            <img src={LOGO_IMAGE_URL} alt="LojinIC Logo" className="h-12 object-contain" />
          </div>
          <nav className="flex items-center gap-6">
             <button onClick={() => setView('all-stores')} className="text-slate-600 hover:text-slate-900 font-medium text-sm hidden sm:block transition">
              Diretório
            </button>
            {user ? (
              <button onClick={() => setView('dashboard')} style={{ backgroundColor: BRAND_BLUE_DARK }} className="text-white px-6 py-2.5 rounded-lg hover:opacity-90 transition text-sm font-medium shadow-sm border border-transparent">
                Acessar Painel
              </button>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setView('login')} className="text-slate-600 hover:text-slate-900 font-medium px-4 py-2.5 text-sm">Entrar</button>
                <button onClick={() => setView('register')} style={{ backgroundColor: BRAND_BLUE_LIGHT }} className="text-white px-6 py-2.5 rounded-lg hover:opacity-90 transition text-sm font-semibold shadow-sm hover:shadow-md">Começar Agora</button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <div style={{ backgroundColor: BRAND_BLUE_DARK }} className="relative py-20 lg:py-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 bg-slate-800 text-blue-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-8 border border-slate-700">
               <Dog size={14} /> Segurança e Força para suas Vendas
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
              Sua loja online robusta <br/> como um <span style={{ color: BRAND_BLUE_LIGHT }}>Pitbull</span>.
            </h1>
            <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Plataforma completa para catálogos digitais e vendas via WhatsApp.
            </p>
            <div className="flex justify-center gap-4">
               <button onClick={() => setView('register')} style={{ backgroundColor: BRAND_BLUE_LIGHT }} className="text-white px-8 py-3 rounded-lg font-bold text-lg hover:opacity-90 transition shadow-lg shadow-blue-900/20">Criar Minha Loja</button>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-slate-50 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Planos Simples</h2>
                <p className="text-slate-500">Sem taxas escondidas. Cancele quando quiser.</p>
             </div>

             <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all">
                   <h3 className="text-lg font-bold text-slate-900 mb-2">Mensal</h3>
                   <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-bold text-slate-900">R$ 25</span>
                      <span className="text-slate-500">/mês</span>
                   </div>
                   <button onClick={() => setView('register')} style={{ borderColor: BRAND_BLUE_DARK, color: BRAND_BLUE_DARK }} className="w-full py-3 rounded-xl border-2 font-bold hover:bg-slate-50 transition">
                      Escolher Mensal
                   </button>
                </div>

                <div style={{ backgroundColor: BRAND_BLUE_DARK }} className="p-8 rounded-2xl shadow-xl border border-slate-800 transform md:-translate-y-4 relative overflow-hidden">
                   <div className="absolute top-0 right-0 bg-yellow-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-bl-xl">MELHOR VALOR</div>
                   <h3 className="text-lg font-bold text-white mb-2">Anual</h3>
                   <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-bold text-white">12x R$ 25</span>
                   </div>
                   <p className="text-slate-400 text-sm mb-6">Total de R$ 300,00 / ano</p>
                   <button onClick={() => setView('register')} style={{ backgroundColor: BRAND_BLUE_LIGHT }} className="w-full py-3 rounded-xl text-white font-bold hover:opacity-90 transition shadow-lg">
                      Escolher Anual
                   </button>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- 2. Auth Form (Botão Google Movido para Baixo) ---
function AuthForm({ type, setView, notify, navigateHome }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('monthly'); 
  const [loading, setLoading] = useState(false);

  // Função para Login com Google
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'stores'), where('ownerId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            const initialColor = BRAND_BLUE_DARK;
            const defaultName = user.displayName || "Minha Loja";
            const storeSlug = defaultName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'stores'), {
                ownerId: user.uid,
                name: defaultName,
                slug: storeSlug,
                logoUrl: getUiAvatar(defaultName, initialColor),
                themeColor: initialColor,
                whatsapp: '',
                plan: selectedPlan, 
                paymentStatus: 'pending',
                createdAt: serverTimestamp()
            });
            notify('Conta criada com Google! Bem-vindo.', 'success');
        } else {
            notify('Login com Google realizado!', 'success');
        }
        setView('dashboard');
    } catch (error) {
        console.error("Erro Google Login:", error);
        let msg = "Erro ao conectar com Google.";
        if (error.code === 'auth/popup-closed-by-user') msg = "Login cancelado.";
        if (error.code === 'auth/unauthorized-domain') msg = "Domínio não autorizado no Firebase. Adicione este domínio no Console.";
        notify(msg, 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const initialColor = BRAND_BLUE_DARK; 
        const storeSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'stores'), {
          ownerId: user.uid,
          name: storeName,
          slug: storeSlug,
          logoUrl: getUiAvatar(storeName, initialColor),
          themeColor: initialColor,
          whatsapp: '',
          plan: selectedPlan,
          paymentStatus: 'pending',
          createdAt: serverTimestamp()
        });
        await updateProfile(user, { displayName: storeName });
        notify('Loja criada com sucesso! Realize o pagamento.', 'success');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        notify('Bem-vindo de volta!', 'success');
      }
      setView('dashboard');
    } catch (error) {
      console.error(error);
      let msg = "Erro ao acessar.";
      if(error.code === 'auth/email-already-in-use') msg = "E-mail já cadastrado.";
      if(error.code === 'auth/wrong-password') msg = "Senha incorreta.";
      notify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-12">
      <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8 flex justify-center">
          <img src={LOGO_IMAGE_URL} alt="LojinIC Logo" className="h-10 object-contain" />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {type === 'register' && (
            <>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome da Loja</label>
              <input type="text" required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 outline-none" placeholder="Ex: Minha Loja" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Plano</label>
              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => setSelectedPlan('monthly')} className={`cursor-pointer border rounded-lg p-3 text-center transition ${selectedPlan === 'monthly' ? `border-[${BRAND_BLUE_LIGHT}] bg-slate-50` : 'border-slate-200 hover:border-slate-300'}`}>
                   <p className="font-bold text-sm">Mensal</p>
                   <p className="text-xs text-slate-500">R$ 25</p>
                </div>
                <div onClick={() => setSelectedPlan('annual')} className={`cursor-pointer border rounded-lg p-3 text-center transition ${selectedPlan === 'annual' ? `border-[${BRAND_BLUE_LIGHT}] bg-slate-50` : 'border-slate-200 hover:border-slate-300'}`}>
                   <p className="font-bold text-sm">Anual</p>
                   <p className="text-xs text-slate-500">R$ 300</p>
                </div>
              </div>
            </div>
            </>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail</label>
            <input type="email" required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 outline-none" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Senha</label>
            <input type="password" required className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 outline-none" placeholder="******" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button type="submit" disabled={loading} style={{ backgroundColor: BRAND_BLUE_DARK }} className="w-full text-white py-3 rounded-lg font-bold shadow-md hover:opacity-90 transition">
            {loading ? 'Carregando...' : (type === 'login' ? 'Entrar' : 'Finalizar Cadastro')}
          </button>
        </form>

        {/* Divisor "OU" */}
        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">ou</span>
            </div>
        </div>

        {/* Botão Google Movido para Baixo */}
        <button 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-50 transition shadow-sm"
        >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {type === 'register' ? 'Cadastrar com Google' : 'Entrar com Google'}
        </button>
        
        <div className="mt-6 text-center">
           <button onClick={() => setView(type === 'login' ? 'register' : 'login')} style={{ color: BRAND_BLUE_LIGHT }} className="font-bold text-sm hover:underline">
             {type === 'login' ? 'Criar conta' : 'Já tenho conta'}
           </button>
        </div>
        <button onClick={navigateHome} className="block w-full mt-4 text-slate-400 text-xs text-center hover:text-slate-600">Voltar ao Início</button>
      </div>
    </div>
  );
}

// --- 3. Dashboard (Admin + Lojista) ---
function Dashboard({ user, setView, notify, navigateToStore, navigateHome }) {
  const isAdmin = user.email === 'admin@lojinic.com'; 

  const [products, setProducts] = useState([]);
  const [storeData, setStoreData] = useState(null);
  const [activeTab, setActiveTab] = useState('products'); 
  const [isAdding, setIsAdding] = useState(false);
  
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdFeatured, setNewProdFeatured] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [settingsWhatsapp, setSettingsWhatsapp] = useState('');
  const [settingsColor, setSettingsColor] = useState(BRAND_BLUE_DARK);
  const [settingsLogo, setSettingsLogo] = useState('');
  const [adminBankInfo, setAdminBankInfo] = useState(null);

  const [adminBankConfig, setAdminBankConfig] = useState({ pixKey: '' }); // Só Chave PIX
  const [allSubscriptions, setAllSubscriptions] = useState([]);

  useEffect(() => {
    if (isAdmin) {
       const loadAdmin = async () => {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'saas_config');
          const snap = await getDoc(docRef);
          if (snap.exists()) setAdminBankConfig(snap.data());
          
          const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'stores'), orderBy('createdAt', 'desc'));
          const unsub = onSnapshot(q, (snap) => {
            setAllSubscriptions(snap.docs.map(d => ({id: d.id, ...d.data()})));
          });
          return unsub;
       };
       loadAdmin();
    } else {
       const qStore = query(collection(db, 'artifacts', appId, 'public', 'data', 'stores'), where('ownerId', '==', user.uid));
       const unsubStore = onSnapshot(qStore, (snap) => {
         if (!snap.empty) {
           const data = snap.docs[0].data();
           setStoreData({ id: snap.docs[0].id, ...data });
           setSettingsName(data.name);
           setSettingsWhatsapp(data.whatsapp || '');
           setSettingsColor(data.themeColor || BRAND_BLUE_DARK);
           setSettingsLogo(data.logoUrl || '');
           
           // Lógica de Redirecionamento Automático para Pagamento se Pendente
           if (data.paymentStatus !== 'active') {
               setActiveTab('subscription');
           }
         }
       });
       const fetchAdminInfo = async () => {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'saas_config');
          const snap = await getDoc(docRef);
          if (snap.exists()) setAdminBankInfo(snap.data());
       };
       fetchAdminInfo();
       return () => unsubStore();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (storeData) {
        const qProd = query(collection(db, 'artifacts', appId, 'public', 'data', 'products'), where('storeId', '==', storeData.id), orderBy('createdAt', 'desc'));
        const unsubProd = onSnapshot(qProd, (snap) => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsubProd();
    }
  }, [storeData]);

  // Handlers
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const finalImage = newProdImage.trim() || getRandomProductImage(newProdName);
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), {
        storeId: storeData.id,
        name: newProdName,
        price: parseFloat(newProdPrice),
        image: finalImage,
        isFeatured: newProdFeatured,
        createdAt: serverTimestamp()
      });
      setIsAdding(false);
      setNewProdName(''); setNewProdPrice(''); setNewProdImage(''); setNewProdFeatured(false);
      notify('Produto adicionado.', 'success');
    } catch (err) { notify('Erro ao adicionar.', 'error'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Excluir este produto?')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id));
      notify('Produto excluído.', 'success');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'stores', storeData.id), {
        name: settingsName,
        whatsapp: settingsWhatsapp.replace(/\D/g, ''),
        themeColor: settingsColor,
        logoUrl: settingsLogo || getUiAvatar(settingsName, settingsColor)
    });
    notify('Configurações salvas.', 'success');
  };

  const handleSaveAdminConfig = async (e) => {
    e.preventDefault();
    // Salva apenas a chave Pix para privacidade
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'saas_config'), { pixKey: adminBankConfig.pixKey }, { merge: true });
    notify('Chave Pix atualizada.', 'success');
  };

  const togglePaymentStatus = async (storeId, currentStatus) => {
      const newStatus = currentStatus === 'active' ? 'pending' : 'active';
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'stores', storeId), {
          paymentStatus: newStatus
      });
      notify(`Status alterado para: ${newStatus === 'active' ? 'Ativo' : 'Pendente'}`, 'success');
  };

  const copyPixKey = () => {
      if(adminBankInfo?.pixKey) {
          navigator.clipboard.writeText(adminBankInfo.pixKey);
          notify('Chave Pix copiada!', 'success');
      }
  };

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
        <header className="bg-slate-800 border-b border-slate-700 p-4">
           <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <img src={LOGO_IMAGE_URL} alt="LojinIC Logo" className="h-8 object-contain" />
                 <span className="font-bold text-slate-400">| Painel Admin</span>
              </div>
              <button onClick={() => { signOut(auth); navigateHome(); }} className="text-sm text-slate-400 hover:text-white">Sair</button>
           </div>
        </header>
        <main className="max-w-7xl mx-auto p-6 grid md:grid-cols-2 gap-8">
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Wallet/> Configurar Recebimento (Privacidade)</h2>
              <p className="text-sm text-slate-400 mb-4">Apenas sua Chave Pix será exibida para os clientes.</p>
              <form onSubmit={handleSaveAdminConfig} className="space-y-4">
                 <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-blue-500 outline-none" value={adminBankConfig.pixKey} onChange={e => setAdminBankConfig({...adminBankConfig, pixKey: e.target.value})} placeholder="Sua Chave PIX (CPF, Email, Telefone...)" />
                 <button style={{ backgroundColor: BRAND_BLUE_LIGHT }} className="text-white px-4 py-2 rounded font-bold w-full hover:opacity-90">Salvar Chave Pix</button>
              </form>
           </div>

           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp/> Gestão de Lojas</h2>
              <div className="overflow-y-auto h-96 space-y-3">
                 {allSubscriptions.map(sub => (
                    <div key={sub.id} className="bg-slate-900 p-4 rounded border border-slate-700 flex justify-between items-center">
                       <div>
                          <p className="font-bold text-white">{sub.name}</p>
                          <p className="text-xs text-slate-400">{sub.plan === 'annual' ? 'Anual (R$ 300)' : 'Mensal (R$ 25)'}</p>
                          <p className={`text-xs font-bold mt-1 ${sub.paymentStatus === 'active' ? 'text-green-400' : 'text-yellow-500'}`}>
                             Status: {sub.paymentStatus === 'active' ? 'ATIVO' : 'PENDENTE'}
                          </p>
                       </div>
                       <button onClick={() => togglePaymentStatus(sub.id, sub.paymentStatus)} className={`px-3 py-1 rounded text-xs font-bold border ${sub.paymentStatus === 'active' ? 'border-red-500 text-red-400' : 'border-green-500 text-green-400'}`}>
                          {sub.paymentStatus === 'active' ? 'Bloquear' : 'Liberar'}
                       </button>
                    </div>
                 ))}
              </div>
           </div>
        </main>
      </div>
    );
  }

  if (!storeData) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-800"></div></div>;

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-white shadow-sm z-10 sticky top-0 border-b border-slate-200">
         <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <img src={storeData.logoUrl} className="h-9 w-9 rounded-md object-cover shadow-sm"/>
               <div>
                  <h1 className="text-lg font-bold text-slate-900 leading-tight">{storeData.name}</h1>
                  <div className="flex items-center gap-2">
                      {storeData.paymentStatus === 'active' ? 
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><CheckCircle2 size={10}/> Ativo</span> : 
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><Lock size={10}/> Pendente</span>
                      }
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-3">
               {storeData.paymentStatus === 'active' && (
                   <button onClick={() => navigateToStore(storeData.id)} style={{ color: BRAND_BLUE_DARK }} className="hover:bg-slate-100 px-3 py-2 rounded-md font-medium transition flex items-center gap-2 text-sm">
                      <ExternalLink size={16} /> Ver Loja
                   </button>
               )}
               <button onClick={() => { signOut(auth); navigateHome(); }} className="text-slate-500 hover:text-red-600 p-2"><LogOut size={18} /></button>
            </div>
         </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
         <div className="flex gap-4 border-b border-slate-200 mb-6 overflow-x-auto pb-2">
            <button onClick={() => setActiveTab('products')} disabled={storeData.paymentStatus !== 'active'} className={`px-4 py-2 text-sm font-bold border-b-2 transition ${activeTab === 'products' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 disabled:opacity-50'}`}>Produtos</button>
            <button onClick={() => setActiveTab('subscription')} className={`px-4 py-2 text-sm font-bold border-b-2 transition ${activeTab === 'subscription' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Assinatura</button>
            <button onClick={() => setActiveTab('settings')} disabled={storeData.paymentStatus !== 'active'} className={`px-4 py-2 text-sm font-bold border-b-2 transition ${activeTab === 'settings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 disabled:opacity-50'}`}>Configurações</button>
         </div>

         {activeTab === 'products' && (
             <div className="animate-fade-in">
                {storeData.paymentStatus !== 'active' ? (
                    <div className="text-center py-10">
                        <Lock className="mx-auto text-slate-300 mb-2" size={48}/>
                        <p className="text-slate-500">Libere sua loja na aba "Assinatura" para cadastrar produtos.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-800">Seu Estoque</h2>
                            <button onClick={() => setIsAdding(!isAdding)} style={{ backgroundColor: BRAND_BLUE_DARK }} className="text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:opacity-90">
                                {isAdding ? <X size={16} /> : <Plus size={16} />} {isAdding ? 'Cancelar' : 'Novo'}
                            </button>
                        </div>
                        {isAdding && (
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
                                <form onSubmit={handleAddProduct} className="space-y-4">
                                    <input required className="w-full border p-2 rounded focus:border-blue-500 outline-none" value={newProdName} onChange={e => setNewProdName(e.target.value)} placeholder="Nome do Produto" />
                                    <div className="flex gap-4">
                                        <input required type="number" className="w-1/2 border p-2 rounded focus:border-blue-500 outline-none" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} placeholder="Preço" />
                                        <input className="w-1/2 border p-2 rounded focus:border-blue-500 outline-none" value={newProdImage} onChange={e => setNewProdImage(e.target.value)} placeholder="URL Imagem (Opcional)" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" checked={newProdFeatured} onChange={e => setNewProdFeatured(e.target.checked)}/> <label>Destaque</label>
                                    </div>
                                    <button style={{ backgroundColor: BRAND_BLUE_DARK }} className="text-white px-4 py-2 rounded text-sm font-bold hover:opacity-90">Salvar</button>
                                </form>
                            </div>
                        )}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        {products.length === 0 ? <div className="p-8 text-center text-slate-500">Nenhum produto.</div> : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b"><tr><th className="p-3">Produto</th><th className="p-3">Preço</th><th className="p-3 text-right">Ação</th></tr></thead>
                                <tbody>
                                    {products.map(p => (
                                        <tr key={p.id} className="border-b last:border-0">
                                        <td className="p-3 flex items-center gap-2"><img src={p.image} className="w-8 h-8 rounded object-cover"/> {p.name}</td>
                                        <td className="p-3 font-bold">{formatCurrency(p.price)}</td>
                                        <td className="p-3 text-right"><button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        </div>
                    </>
                )}
             </div>
         )}

         {activeTab === 'subscription' && (
             <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md border border-slate-200 animate-fade-in">
                 <div className="text-center mb-8">
                     <div className="bg-blue-50 text-blue-700 p-3 rounded-full inline-block mb-4">
                        <Wallet size={32}/>
                     </div>
                     <h3 className="font-bold text-2xl text-slate-900">Pagamento da Assinatura</h3>
                     <p className="text-slate-500 mt-2">Faça o Pix para liberar sua loja imediatamente.</p>
                 </div>

                 <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 mb-6">
                     <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                         <span className="text-slate-500 font-medium">Plano Escolhido</span>
                         <span className="font-bold text-lg text-slate-900">{storeData.plan === 'annual' ? 'Anual (R$ 300)' : 'Mensal (R$ 25)'}</span>
                     </div>
                     
                     {adminBankInfo && adminBankInfo.pixKey ? (
                        <div className="text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Chave Pix para Pagamento</p>
                            <div className="flex items-center justify-center gap-2 bg-white border border-blue-200 p-3 rounded-lg mb-4">
                                <code className="text-lg font-mono font-bold text-blue-700 select-all">{adminBankInfo.pixKey}</code>
                            </div>
                            <button onClick={copyPixKey} className="text-sm text-blue-600 hover:text-blue-800 font-bold flex items-center justify-center gap-1 mx-auto">
                                <Copy size={16}/> Copiar Chave Pix
                            </button>
                        </div>
                     ) : (
                        <p className="text-red-500 text-sm text-center">Chave Pix indisponível. Contate o suporte.</p>
                     )}
                 </div>

                 <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg text-sm text-yellow-800 text-center">
                     <p className="font-bold mb-1">⏳ Status: {storeData.paymentStatus === 'active' ? 'Ativo' : 'Aguardando Liberação'}</p>
                     {storeData.paymentStatus !== 'active' && <p>Após o pagamento, sua loja será liberada pelo administrador.</p>}
                 </div>
             </div>
         )}

         {activeTab === 'settings' && (
             <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                 <form onSubmit={handleSaveSettings} className="space-y-4">
                     <input className="w-full border p-2 rounded focus:border-blue-500 outline-none" value={settingsName} onChange={e => setSettingsName(e.target.value)} placeholder="Nome da Loja" />
                     <input className="w-full border p-2 rounded focus:border-blue-500 outline-none" value={settingsWhatsapp} onChange={e => setSettingsWhatsapp(e.target.value)} placeholder="WhatsApp (só números)" />
                     <div className="flex items-center gap-2">
                         <input type="color" className="h-10 w-16" value={settingsColor} onChange={e => setSettingsColor(e.target.value)} />
                         <span className="text-sm text-slate-500">Cor da sua marca</span>
                     </div>
                     <button style={{ backgroundColor: BRAND_BLUE_DARK }} className="text-white px-6 py-2 rounded font-bold w-full hover:opacity-90">Salvar Configurações</button>
                 </form>
             </div>
         )}
      </main>
    </div>
  );
}

// --- 4. Storefront (Consumidor Final) ---
function Storefront({ storeId, setView, notify, navigateHome }) {
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pix na Entrega'); 

  useEffect(() => {
    if(!storeId) return;
    const unsubStore = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'stores', storeId), (doc) => {
      if (doc.exists()) setStore({id: doc.id, ...doc.data()});
    });
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'products'), where('storeId', '==', storeId), orderBy('createdAt', 'desc'));
    const unsubProds = onSnapshot(q, (snap) => setProducts(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsubStore(); unsubProds(); };
  }, [storeId]);

  const addToCart = (product) => { setCart([...cart, product]); notify('Adicionado!', 'success'); setIsCartOpen(true); };
  const removeFromCart = (i) => setCart(cart.filter((_, idx) => idx !== i));
  const total = cart.reduce((acc, item) => acc + item.price, 0);

  const handleFinalizeCheckout = () => {
      if (!store.whatsapp) { alert("Loja sem WhatsApp configurado."); return; }
      if (!customerName) { alert("Por favor, digite seu nome."); return; }
      
      let message = `*Novo Pedido - ${store.name}*\n`;
      message += `👤 Cliente: ${customerName}\n`;
      message += `💳 Pagamento: ${paymentMethod}\n\n`;
      message += `*Itens:*\n`;
      cart.forEach(item => { message += `• 1x ${item.name} - ${formatCurrency(item.price)}\n`; });
      message += `\n💰 *Total: ${formatCurrency(total)}*`;
      message += `\n\n_Pedido via LojinIC_`;

      window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
      setIsCartOpen(false);
      setCart([]);
      setCheckoutStep('cart');
  };

  if (!store) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div></div>;
  const brandColor = store.themeColor || BRAND_BLUE_DARK;

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={store.logoUrl} className="h-8 w-8 rounded object-cover"/>
            <h1 className="font-bold text-lg">{store.name}</h1>
          </div>
          <div className="flex gap-4">
             <button onClick={navigateHome} className="text-xs font-bold uppercase text-slate-400 hidden sm:block hover:text-slate-600">LojinIC</button>
             <button onClick={() => setIsCartOpen(true)} className="relative p-2 bg-slate-50 rounded-full">
               <ShoppingBag size={20} />
               {cart.length > 0 && <span style={{backgroundColor: brandColor}} className="absolute -top-1 -right-1 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{cart.length}</span>}
             </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        {products.length === 0 ? <div className="text-center py-20 text-slate-400">Loja em construção.</div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <div key={prod.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col group shadow-sm hover:shadow-md transition">
                <div className="h-48 bg-slate-50 relative overflow-hidden">
                   <img src={prod.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" onError={(e) => e.target.src = getUiAvatar(prod.name)} />
                </div>
                <div className="p-4 flex flex-col flex-grow">
                   <h3 className="font-bold text-sm mb-1 line-clamp-2">{prod.name}</h3>
                   <div className="mt-auto flex justify-between items-center pt-2">
                      <span className="font-bold">{formatCurrency(prod.price)}</span>
                      <button onClick={() => addToCart(prod)} style={{backgroundColor: brandColor}} className="text-white p-2 rounded-full hover:opacity-90"><Plus size={16}/></button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
           <div className="absolute inset-0 bg-black/50" onClick={() => setIsCartOpen(false)}></div>
           <div className="w-full max-w-sm bg-white z-10 flex flex-col shadow-2xl animate-slide-in-right">
              <div className="p-4 border-b flex justify-between items-center">
                 <h2 className="font-bold">{checkoutStep === 'cart' ? 'Sua Sacola' : 'Finalizar Pedido'}</h2>
                 <button onClick={() => setIsCartOpen(false)}><X size={20}/></button>
              </div>
              
              {checkoutStep === 'cart' ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                     {cart.length === 0 && <p className="text-center text-slate-400 py-10">Vazia.</p>}
                     {cart.map((item, i) => (
                        <div key={i} className="flex gap-3 bg-slate-50 p-2 rounded border border-slate-100">
                           <img src={item.image} className="w-12 h-12 rounded object-cover"/>
                           <div className="flex-1">
                              <p className="text-sm font-bold line-clamp-1">{item.name}</p>
                              <p className="text-xs text-slate-500">{formatCurrency(item.price)}</p>
                           </div>
                           <button onClick={() => removeFromCart(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                     ))}
                  </div>
                  <div className="p-4 border-t bg-slate-50">
                     <div className="flex justify-between font-bold mb-4 text-lg"><span>Total</span><span>{formatCurrency(total)}</span></div>
                     <button onClick={() => setCheckoutStep('details')} disabled={cart.length===0} style={{backgroundColor: brandColor}} className="w-full text-white py-3 rounded-lg font-bold">
                        Continuar
                     </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 p-6 flex flex-col gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-2 flex items-start gap-3">
                        <Truck className="text-green-600 shrink-0" size={24}/>
                        <div>
                           <p className="text-sm font-bold text-green-800">Compra 100% Segura</p>
                           <p className="text-xs text-green-700">Pagamento somente na entrega.</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Seu Nome</label>
                        <input className="w-full border p-2 rounded focus:border-blue-500 outline-none" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Digite seu nome..." />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Forma de Pagamento (Na Entrega)</label>
                        <select className="w-full border p-2 rounded focus:border-blue-500 outline-none" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                            <option value="Pix na Entrega">Pix (Na Entrega)</option>
                            <option value="Dinheiro na Entrega">Dinheiro (Na Entrega)</option>
                            <option value="Cartão na Entrega">Cartão (Na Entrega)</option>
                        </select>
                    </div>
                    <div className="mt-auto">
                        <button onClick={handleFinalizeCheckout} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition">
                            <MessageCircle size={20}/> Enviar Pedido no WhatsApp
                        </button>
                        <button onClick={() => setCheckoutStep('cart')} className="w-full text-slate-500 text-sm mt-2">Voltar</button>
                    </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}

// --- 5. Lista de Lojas ---
function AllStoresList({ setView, navigateToStore, navigateHome }) {
  const [stores, setStores] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'stores'), orderBy('createdAt', 'desc')), (snap) => {
      setStores(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
         <div className="flex items-center gap-4 mb-8">
            <button onClick={navigateHome} className="bg-white p-2 rounded-full shadow-sm"><ChevronRight className="rotate-180"/></button>
            <h1 className="text-2xl font-bold">Diretório LojinIC</h1>
         </div>
         <div className="grid md:grid-cols-3 gap-6">
            {stores.map(store => (
               <div key={store.id} onClick={() => navigateToStore(store.id)} className="bg-white p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition border border-slate-200 flex items-center gap-4">
                  <img src={store.logoUrl} className="w-16 h-16 rounded-lg object-cover bg-slate-100"/>
                  <div>
                     <h3 className="font-bold text-lg">{store.name}</h3>
                     <div className="flex items-center gap-2">
                       {store.whatsapp && <span className="text-[10px] bg-green-100 text-green-800 px-1 rounded font-bold">WhatsApp ON</span>}
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
