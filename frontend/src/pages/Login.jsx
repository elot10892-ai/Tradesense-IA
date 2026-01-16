import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import Button from '../components/common/Button';

const Login = () => {
    const { t, i18n } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, error } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isRtl = i18n.language === 'ar';

    // Success message from Register redirection
    const successMessage = location.state?.message;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) return;

        setIsSubmitting(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`min-h-[calc(100vh-64px)] flex items-center justify-center p-4 font-primary ${isRtl ? 'rtl text-right' : 'ltr text-left'}`}>
            <div className="w-full max-w-md bg-background-card p-10 rounded-2xl shadow-2xl border border-border animate-slide-up">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black mb-2 text-text-primary uppercase tracking-tight">{t('auth.login_title')} 👋</h1>
                    <p className="text-text-secondary font-medium">{t('auth.login_subtitle')}</p>
                </div>

                {successMessage && (
                    <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-xl flex items-center gap-3 text-success animate-fade-in shadow-sm">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-bold">{successMessage}</p>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-danger animate-shake shadow-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-bold">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-black mb-2 text-text-secondary uppercase tracking-widest">{t('auth.email')}</label>
                        <input
                            type="email"
                            className="w-full bg-background-input border border-border rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="trader@tradesense.ai"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-black mb-2 text-text-secondary uppercase tracking-widest">{t('auth.password')}</label>
                        <input
                            type="password"
                            className="w-full bg-background-input border border-border rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <div className="flex justify-end mt-2">
                            <a href="#" className="text-xs text-primary hover:underline font-bold uppercase tracking-tight">
                                {t('auth.forgot_password')}
                            </a>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-primary text-black font-black hover:bg-primary/90 flex justify-center items-center gap-2 shadow-glow-green uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {t('common.loading')}
                            </>
                        ) : (
                            <>
                                {t('auth.submit_login')} <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
                            </>
                        )}
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm font-bold text-text-secondary">
                    {t('auth.no_account')}{' '}
                    <Link to="/register" className="text-primary hover:underline font-black uppercase ml-1">
                        {t('auth.sign_up')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
