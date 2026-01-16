import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Users, AlertTriangle, CheckCircle, XCircle, Search, Shield, RefreshCw, Trophy, Menu, X, LayoutDashboard, CreditCard, Trash2, Plus } from 'lucide-react';
import { FiLogOut } from 'react-icons/fi';
import api from '../api/axios';
import apiPayment from '../api/apiPayment';

const AdminPaypal = ({ isRtl }) => {
    const { t } = useTranslation();
    const [config, setConfig] = useState({ client_id: '', client_secret: '', mode: 'sandbox' });
    const [hasSecret, setHasSecret] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await apiPayment.getPaypalConfig();
                setConfig({ ...config, client_id: data.client_id, mode: data.mode });
                setHasSecret(data.has_secret);
            } catch (err) {
                setError(t('common.error'));
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [t]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        setError(null);
        try {
            await apiPayment.updatePaypalConfig(config);
            setMessage(t('admin.paypal_updated_success') || 'Configuration mise à jour');
            if (config.client_secret) setHasSecret(true);
            setConfig({ ...config, client_secret: '' }); // Clear secret field after save
        } catch (err) {
            setError(err.response?.data?.error || t('common.error'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center py-10"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;

    return (
        <div className="bg-background-card rounded-xl border border-border p-6 font-primary max-w-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-text-primary">
                <CreditCard className="w-5 h-5 text-primary" /> Configuration PayPal
            </h2>

            {message && <div className="mb-4 p-3 bg-success/10 border border-success/30 rounded-lg text-success text-sm">{message}</div>}
            {error && <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">{error}</div>}

            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-text-secondary mb-1.5">Client ID</label>
                    <input
                        type="text"
                        value={config.client_id}
                        onChange={(e) => setConfig({ ...config, client_id: e.target.value })}
                        className="w-full bg-background-input border border-border rounded-lg px-4 py-2.5 text-text-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder="Ex: AU..."
                    />
                </div>

                <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-text-secondary mb-1.5 flex justify-between">
                        <span>{isRtl ? 'Secret Client' : 'Client Secret'}</span>
                        {hasSecret && <span className="text-success hover:scale-105 transition-transform cursor-help" title="Configuré">✓</span>}
                    </label>
                    <input
                        type="password"
                        value={config.client_secret}
                        onChange={(e) => setConfig({ ...config, client_secret: e.target.value })}
                        className="w-full bg-background-input border border-border rounded-lg px-4 py-2.5 text-text-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        placeholder={hasSecret ? "••••••••••••••••" : "Ex: EL..."}
                    />
                </div>

                <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-text-secondary mb-1.5">Mode</label>
                    <select
                        value={config.mode}
                        onChange={(e) => setConfig({ ...config, mode: e.target.value })}
                        className="w-full bg-background-input border border-border rounded-lg px-4 py-2.5 text-text-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    >
                        <option value="sandbox">Sandbox (Test)</option>
                        <option value="live">Live (Production)</option>
                    </select>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-primary text-black font-black uppercase tracking-widest py-3 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                        Enregistrer la configuration
                    </button>
                </div>
            </form>
        </div>
    );
};

const AdminUsers = ({ users, loading, onRefresh }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-background-card rounded-xl border border-border p-6 font-primary">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> {t('admin.user_management')}
            </h2>

            <div className="mb-4 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                    type="text"
                    placeholder={t('admin.search_user')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-background-input rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    {t('admin.loading')}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm rtl:text-right">
                        <thead className="text-text-secondary border-b border-border">
                            <tr>
                                <th className="pb-3 px-2">{t('admin.name')}</th>
                                <th className="pb-3">{t('admin.email')}</th>
                                <th className="pb-3">{t('admin.role')}</th>
                                <th className="pb-3">{t('admin.status')}</th>
                                <th className="pb-3">{t('admin.date')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-secondary/10 transition-colors">
                                    <td className="py-3 px-2 font-medium text-text-primary">{u.username}</td>
                                    <td className="py-3 text-text-secondary">{u.email}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${u.role === 'admin' || u.role === 'superadmin'
                                            ? 'bg-primary/20 text-primary'
                                            : 'bg-background-input text-text-secondary'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.is_active
                                            ? 'bg-success/20 text-success'
                                            : 'bg-danger/20 text-danger'
                                            }`}>
                                            {u.is_active ? t('admin.active') : t('admin.inactive')}
                                        </span>
                                    </td>
                                    <td className="py-3 text-text-secondary">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                        <div className="text-center py-8 text-gray-500 italic">
                            {t('admin.no_user_found')}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const AdminChallenges = ({ challenges, loading, onRefresh }) => {
    const { t } = useTranslation();
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState(null);

    const handlePass = async (challengeId) => {
        setActionLoading(challengeId);
        setError(null);
        try {
            await api.put(`/api/admin/challenge/${challengeId}/pass`);
            await onRefresh();
        } catch (err) {
            setError(err.response?.data?.error || t('common.error'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleFail = async (challengeId) => {
        setActionLoading(challengeId);
        setError(null);
        try {
            await api.put(`/api/admin/challenge/${challengeId}/fail`);
            await onRefresh();
        } catch (err) {
            setError(err.response?.data?.error || t('common.error'));
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="bg-background-card rounded-xl border border-border p-6 font-primary">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-text-primary">
                <TrophyIcon className="w-5 h-5 text-warning" /> {t('admin.challenge_management')}
            </h2>

            {error && (
                <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2 animate-shake">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-8 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    {t('admin.loading')}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm rtl:text-right">
                        <thead className="text-text-secondary border-b border-border">
                            <tr>
                                <th className="pb-3 px-2">{t('admin.id')}</th>
                                <th className="pb-3">{t('admin.user')}</th>
                                <th className="pb-3">{t('admin.plan')}</th>
                                <th className="pb-3">{t('admin.capital')}</th>
                                <th className="pb-3">{t('admin.pl')}</th>
                                <th className="pb-3">{t('admin.status')}</th>
                                <th className="pb-3 text-right rtl:text-left">{t('admin.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {challenges.map(c => {
                                const profit = c.current_balance - c.initial_balance;
                                return (
                                    <tr key={c.id} className="hover:bg-secondary/10 transition-colors">
                                        <td className="py-3 px-2 font-mono text-xs text-text-secondary">
                                            #{c.id.substring(0, 8)}
                                        </td>
                                        <td className="py-3 font-medium text-text-primary">
                                            {c.user?.username || 'N/A'}
                                        </td>
                                        <td className="py-3 text-text-primary">
                                            ${c.initial_balance.toLocaleString()}
                                        </td>
                                        <td className="py-3 text-text-primary">
                                            ${c.current_balance.toLocaleString()}
                                        </td>
                                        <td className={`py-3 font-bold ${profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                                        </td>
                                        <td className="py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs uppercase font-black tracking-wider 
                                                ${c.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                                                    c.status === 'passed' ? 'bg-success/20 text-success' :
                                                        'bg-danger/20 text-danger'}`}>
                                                {c.status === 'active' ? t('status.active') :
                                                    c.status === 'passed' ? t('status.passed') : t('status.failed')}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right rtl:text-left flex justify-end gap-2 px-2">
                                            <button
                                                onClick={() => handlePass(c.id)}
                                                disabled={actionLoading === c.id || c.status !== 'active'}
                                                title={t('admin.mark_passed')}
                                                className={`p-1.5 rounded-lg transition-all ${c.status !== 'active'
                                                    ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
                                                    : 'bg-success/10 text-success hover:bg-success hover:text-white shadow-sm'
                                                    }`}
                                            >
                                                {actionLoading === c.id ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleFail(c.id)}
                                                disabled={actionLoading === c.id || c.status !== 'active'}
                                                title={t('admin.mark_failed')}
                                                className={`p-1.5 rounded-lg transition-all ${c.status !== 'active'
                                                    ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
                                                    : 'bg-danger/10 text-danger hover:bg-danger hover:text-white shadow-sm'
                                                    }`}
                                            >
                                                {actionLoading === c.id ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <XCircle className="w-4 h-4" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {challenges.length === 0 && (
                        <div className="text-center py-8 text-gray-500 italic">
                            {t('admin.no_challenge_found')}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const AdminMasterClasses = ({ isRtl }) => {
    const { t } = useTranslation();
    const [masterclasses, setMasterclasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', level: 'Débutant', category: 'Trading', duration: '', video_url: '', video_type: 'local'
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMasterClasses();
    }, []);

    const fetchMasterClasses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/masterclasses');
            setMasterclasses(response.data);
        } catch (err) {
            setError("Erreur lors de la récupération des masterclasses");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cette masterclass ?")) return;
        try {
            await api.delete(`/api/admin/masterclasses/${id}`);
            setMasterclasses(masterclasses.filter(m => m.id !== id));
        } catch (err) {
            alert("Erreur lors de la suppression");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await api.post('/api/admin/masterclasses', formData);
            setMasterclasses([response.data, ...masterclasses]);
            setShowForm(false);
            setFormData({ title: '', description: '', level: 'Débutant', category: 'Trading', duration: '', video_url: '', video_type: 'local' });
        } catch (err) {
            setError(err.response?.data?.error || "Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2 text-text-primary">
                    <BookOpen className="w-5 h-5 text-warning" /> Gestion MasterClasses
                </h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-warning text-black font-black uppercase text-xs rounded-xl shadow-lg shadow-warning/20 hover:scale-105 transition-all"
                >
                    {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showForm ? 'Annuler' : 'Ajouter une MasterClass'}
                </button>
            </div>

            {showForm && (
                <div className="bg-background-card p-6 rounded-2xl border border-warning/30 animate-slide-up">
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black uppercase text-text-secondary mb-1">Titre</label>
                            <input
                                type="text" value={formData.title} required
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-background-input border border-border rounded-lg px-4 py-2 text-sm"
                                placeholder="Titre de la masterclass"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black uppercase text-text-secondary mb-1">Description</label>
                            <textarea
                                value={formData.description} required
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-background-input border border-border rounded-lg px-4 py-2 text-sm h-24"
                                placeholder="Description détaillée..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase text-text-secondary mb-1">Niveau</label>
                            <select
                                value={formData.level}
                                onChange={e => setFormData({ ...formData, level: e.target.value })}
                                className="w-full bg-background-input border border-border rounded-lg px-4 py-2 text-sm"
                            >
                                <option value="Débutant">Débutant</option>
                                <option value="Intermédiaire">Intermédiaire</option>
                                <option value="Avancé">Avancé</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase text-text-secondary mb-1">Catégorie</label>
                            <input
                                type="text" value={formData.category} required
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-background-input border border-border rounded-lg px-4 py-2 text-sm"
                                placeholder="Trading, Psychologie..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase text-text-secondary mb-1">Durée</label>
                            <input
                                type="text" value={formData.duration} required
                                onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                className="w-full bg-background-input border border-border rounded-lg px-4 py-2 text-sm"
                                placeholder="Ex: 45 min"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase text-text-secondary mb-1">Type Vidéo</label>
                            <select
                                value={formData.video_type}
                                onChange={e => setFormData({ ...formData, video_type: e.target.value })}
                                className="w-full bg-background-input border border-border rounded-lg px-4 py-2 text-sm"
                            >
                                <option value="local">Vidéo Locale (MP4 /public)</option>
                                <option value="embed">Lien Externe (Vimeo/Iframe)</option>
                                <option value="placeholder">Placeholder (Simulé)</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black uppercase text-text-secondary mb-1">URL Vidéo / ID Unique</label>
                            <input
                                type="text" value={formData.video_url} required
                                onChange={e => setFormData({ ...formData, video_url: e.target.value })}
                                className="w-full bg-background-input border border-border rounded-lg px-4 py-2 text-sm"
                                placeholder="Ex: /masterclass_videos/intro.mp4 ou URL Vimeo"
                            />
                        </div>
                        <div className="md:col-span-2 pt-2">
                            <button
                                type="submit" disabled={saving}
                                className="w-full py-3 bg-warning text-black font-black uppercase text-xs rounded-xl shadow-lg shadow-warning/20 hover:bg-warning/90 transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Enregistrer la MasterClass
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-background-card rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="text-text-secondary border-b border-border bg-background-input/50">
                        <tr>
                            <th className="py-3 px-4 font-black uppercase text-[10px]">Titre</th>
                            <th className="py-3 px-4 font-black uppercase text-[10px]">Catégorie</th>
                            <th className="py-3 px-4 font-black uppercase text-[10px]">Niveau</th>
                            <th className="py-3 px-4 font-black uppercase text-[10px] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {loading ? (
                            <tr><td colSpan="4" className="py-8 text-center text-text-secondary">Chargement...</td></tr>
                        ) : masterclasses.length === 0 ? (
                            <tr><td colSpan="4" className="py-8 text-center text-text-secondary">Aucune masterclass</td></tr>
                        ) : (
                            masterclasses.map(m => (
                                <tr key={m.id} className="hover:bg-secondary/5 transition-colors">
                                    <td className="py-3 px-4 font-medium text-text-primary">{m.title}</td>
                                    <td className="py-3 px-4 text-text-secondary text-xs">{m.category}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${m.level === 'Débutant' ? 'bg-success/20 text-success' :
                                            m.level === 'Intermédiaire' ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'
                                            }`}>{m.level}</span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <button
                                            onClick={() => handleDelete(m.id)}
                                            className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const BookOpen = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
);

const TrophyIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
);

const Admin = () => {
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState('users');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [challenges, setChallenges] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const isRtl = i18n.language === 'ar';

    useEffect(() => {
        const checkAdminAccess = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                await api.get('/api/admin/');
                await fetchAllData();
            } catch (err) {
                console.error('Admin access denied:', err);
                if (err.response?.status === 403 || err.response?.status === 401) {
                    setError(t('admin.must_be_admin'));
                    setTimeout(() => logout(), 2000);
                } else {
                    setError(t('common.error'));
                }
                setLoading(false);
            }
        };

        checkAdminAccess();
    }, [navigate, t]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [usersRes, challengesRes, statsRes] = await Promise.all([
                api.get('/api/admin/users'),
                api.get('/api/admin/challenges'),
                api.get('/api/admin/stats')
            ]);

            setUsers(usersRes.data.users || []);
            setChallenges(challengesRes.data.challenges || []);
            setStats(statsRes.data.metrics || {});
            setError(null);
        } catch (err) {
            console.error('Error fetching admin data:', err);
            setError(err.response?.data?.error || t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        await fetchAllData();
    };

    if (error && !stats) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen flex items-center justify-center font-primary">
                <div className="bg-background-card p-10 rounded-2xl border border-danger/30 shadow-2xl text-center">
                    <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-6" />
                    <h2 className="text-2xl font-black mb-2 text-text-primary uppercase tracking-tight">{t('admin.access_denied')}</h2>
                    <p className="text-text-secondary font-medium">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-background flex flex-col lg:flex-row animate-fade-in overflow-hidden font-primary ${isRtl ? 'rtl' : 'ltr'}`}>
            <aside
                className={`bg-background-card border-b lg:border-b-0 ${isRtl ? 'lg:border-l' : 'lg:border-r'} border-border flex flex-col lg:h-screen sticky top-0 z-50 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-full lg:w-64' : 'w-full lg:w-20'
                    }`}
            >
                {/* Header Section */}
                <div className={`flex items-center justify-between border-b border-border transition-all duration-300 ${isSidebarOpen ? 'p-6' : 'p-4 lg:justify-center'}`}>
                    <div className={`items-center gap-3 transition-all duration-300 ${isSidebarOpen ? 'flex' : 'hidden'}`}>
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 transition-transform hover:rotate-0">
                            <Shield className="text-black w-5 h-5" />
                        </div>
                        <span className="text-xl font-black text-text-primary tracking-tighter uppercase whitespace-nowrap">
                            Admin <span className="text-primary italic">Panel</span>
                        </span>
                    </div>

                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-2 hover:bg-background-input rounded-xl transition-all text-text-secondary hover:text-primary lg:flex hidden ${!isSidebarOpen && 'mx-auto'}`}
                    >
                        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>

                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden p-2 text-text-secondary hover:text-primary transition-colors"
                    >
                        {isSidebarOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                    </button>
                </div>

                {/* Main Navigation - Scrollable and takes remaining space */}
                <nav className={`flex-1 flex flex-row lg:flex-col gap-1 p-3 lg:px-3 lg:py-4 overflow-x-auto lg:overflow-y-auto no-scrollbar ${!isSidebarOpen && 'lg:items-center'}`}>
                    {[
                        { id: 'users', label: t('admin.user_management'), icon: Users, color: 'text-primary' },
                        { id: 'challenges', label: t('admin.challenge_management'), icon: Trophy, color: 'text-warning' },
                        { id: 'masterclasses', label: 'MasterClasses', icon: BookOpen, color: 'text-warning' },
                        { id: 'paypal', label: 'PayPal', icon: CreditCard, color: 'text-info' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-black text-xs lg:text-sm shrink-0 group relative border border-transparent ${activeTab === item.id
                                ? `bg-primary/10 ${item.color} border-primary/20 shadow-sm`
                                : 'text-text-secondary hover:text-text-primary hover:bg-background-input'
                                } ${!isSidebarOpen && 'lg:w-12 lg:h-12 lg:justify-center lg:px-0'}`}
                            title={!isSidebarOpen ? item.label : ''}
                        >
                            <item.icon className={`w-5 h-5 shrink-0 transition-all duration-300 ${activeTab === item.id ? item.color : 'text-text-secondary group-hover:scale-110'}`} />
                            {isSidebarOpen && (
                                <span className="uppercase tracking-widest text-[11px] font-black whitespace-nowrap">
                                    {item.label}
                                </span>
                            )}
                        </button>
                    ))}

                    {/* Bottom Utilities - mt-auto pushes them to the bottom */}
                    <div className="lg:mt-auto border-t border-border pt-4 flex flex-col gap-1.5 transition-all duration-300">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-black text-xs lg:text-sm text-text-secondary hover:bg-secondary/10 group ${!isSidebarOpen && 'lg:w-12 lg:h-12 lg:justify-center lg:px-0'}`}
                            title={!isSidebarOpen ? t('admin.dashboard') : ''}
                        >
                            <LayoutDashboard className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
                            {isSidebarOpen && <span className="uppercase tracking-widest text-[11px] font-black">{t('admin.dashboard')}</span>}
                        </button>

                        <button
                            onClick={logout}
                            className={`flex items-center gap-3 lg:gap-4 px-4 py-2.5 rounded-xl transition-all font-black text-xs lg:text-sm text-danger hover:bg-danger/10 group relative border border-transparent ${!isSidebarOpen && 'lg:w-12 lg:h-12 lg:justify-center lg:px-0'}`}
                            title={!isSidebarOpen ? t('admin.logout') : ''}
                        >
                            <FiLogOut className={`w-5 h-5 shrink-0 transition-all duration-300 text-danger group-hover:scale-110`} />
                            {isSidebarOpen && (
                                <span className="uppercase tracking-widest text-[11px] font-black whitespace-nowrap">
                                    {t('admin.logout')}
                                </span>
                            )}
                        </button>
                    </div>
                </nav>
            </aside>

            <div className="flex-1 overflow-y-auto max-h-screen custom-scrollbar bg-background">
                <main className="p-6 md:p-10">
                    <div className="max-w-[1700px] mx-auto">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                            <div className="flex items-center gap-4">
                                <h1 className="text-4xl font-black text-text-primary tracking-tighter uppercase">
                                    {activeTab === 'users' ? t('admin.user_management') :
                                        activeTab === 'challenges' ? t('admin.challenge_management') :
                                            activeTab === 'masterclasses' ? 'MasterClasses' : 'PayPal'}
                                </h1>
                                <button
                                    onClick={handleRefresh}
                                    disabled={loading}
                                    className="p-3 rounded-xl bg-background-card border border-border hover:bg-secondary/10 transition-all disabled:opacity-50 group active:scale-95 shadow-sm"
                                >
                                    <RefreshCw className={`w-5 h-5 text-primary transition-transform duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full lg:w-auto">
                                <div className="bg-background-card px-6 py-4 rounded-2xl border border-border shadow-sm flex flex-col justify-center">
                                    <div className="text-[10px] text-text-secondary font-black uppercase tracking-widest mb-1">{t('admin.total_users')}</div>
                                    <div className="text-2xl font-bold text-text-primary">{stats?.total_users || 0}</div>
                                </div>
                                <div className="bg-background-card px-6 py-4 rounded-2xl border border-border shadow-sm flex flex-col justify-center">
                                    <div className="text-[10px] text-text-secondary font-black uppercase tracking-widest mb-1">{t('admin.active_challenges')}</div>
                                    <div className="text-2xl font-bold text-primary">{stats?.active_challenges || 0}</div>
                                </div>
                                <div className="bg-background-card px-6 py-4 rounded-2xl border border-border shadow-sm hidden md:flex flex-col justify-center">
                                    <div className="text-[10px] text-text-secondary font-black uppercase tracking-widest mb-1">{t('admin.total_revenue')}</div>
                                    <div className="text-2xl font-bold text-success">${stats?.total_revenue?.toLocaleString() || '0'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="animate-slide-up">
                            {activeTab === 'users' ? (
                                <AdminUsers users={users} loading={loading} onRefresh={handleRefresh} />
                            ) : activeTab === 'challenges' ? (
                                <AdminChallenges challenges={challenges} loading={loading} onRefresh={handleRefresh} />
                            ) : activeTab === 'masterclasses' ? (
                                <AdminMasterClasses isRtl={isRtl} />
                            ) : (
                                <AdminPaypal isRtl={isRtl} />
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Admin;
