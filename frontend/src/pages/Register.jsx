import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import Button from '../components/common/Button';

const Register = () => {
    const { t, i18n } = useTranslation();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState('');
    const { register, error: authError } = useAuth();
    const navigate = useNavigate();

    const isRtl = i18n.language === 'ar';

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setLocalError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setLocalError(t('auth.password_mismatch'));
            return;
        }

        if (formData.password.length < 8) {
            setLocalError(t('auth.password_min'));
            return;
        }

        setIsSubmitting(true);
        try {
            await register(formData.username, formData.email, formData.password);
            navigate('/login', { state: { message: t('auth.register_success') } });
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayError = localError || authError;

    return (
        <div className={`min-h-[calc(100vh-64px)] flex items-center justify-center p-4 font-primary ${isRtl ? 'rtl text-right' : 'ltr text-left'}`}>
            <div className="w-full max-w-md bg-background-card p-10 rounded-2xl shadow-2xl border border-border animate-slide-up">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black mb-2 text-text-primary uppercase tracking-tight">{t('auth.register_title')} 🚀</h1>
                    <p className="text-text-secondary font-medium">{t('auth.register_subtitle')}</p>
                </div>

                {displayError && (
                    <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-danger animate-shake shadow-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-bold">{displayError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-black mb-1 text-text-secondary uppercase tracking-widest">{t('auth.username')}</label>
                        <input
                            type="text"
                            name="username"
                            className="w-full bg-background-input border border-border rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="TraderPro2025"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-black mb-1 text-text-secondary uppercase tracking-widest">{t('auth.email')}</label>
                        <input
                            type="email"
                            name="email"
                            className="w-full bg-background-input border border-border rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="votre@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-black mb-1 text-text-secondary uppercase tracking-widest">{t('auth.password')}</label>
                        <input
                            type="password"
                            name="password"
                            className="w-full bg-background-input border border-border rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <p className="text-[10px] text-text-secondary mt-1 font-bold uppercase tracking-widest">{t('auth.password_min')}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-black mb-1 text-text-secondary uppercase tracking-widest">{t('auth.confirm_password')}</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="w-full bg-background-input border border-border rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 mt-6 bg-success text-white font-black hover:bg-success/90 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(14,203,129,0.2)] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {t('common.loading')}
                            </>
                        ) : (
                            <>
                                {t('auth.submit_register')} <CheckCircle2 className="w-5 h-5" />
                            </>
                        )}
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm font-bold text-text-secondary">
                    {t('auth.already_account')}{' '}
                    <Link to="/login" className="text-primary hover:underline font-black uppercase ml-1">
                        {t('auth.sign_in')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
