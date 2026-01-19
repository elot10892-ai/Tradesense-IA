import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Menu, X, BarChart2, Shield, LogOut } from 'lucide-react';
import { useState } from 'react';
import Button from './Button';
import LanguageSwitcher from './LanguageSwitcher';

import ThemeToggle from './ThemeToggle';

const Navbar = () => {
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isRtl = i18n.language === 'ar';

    return (
        <nav className="bg-background-card border-b border-border sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="bg-primary/20 p-2 rounded-lg">
                            <BarChart2 className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            TradeSense AI
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/pricing" className="text-text-secondary hover:text-text-primary transition-colors">{t('navbar.pricing')}</Link>
                        <Link to="/leaderboard" className="text-text-secondary hover:text-text-primary transition-colors">{t('navbar.leaderboard')}</Link>

                        {/* CONDITIONAL DASHBOARD LINK */}
                        {isAuthenticated && user?.activeChallenge && (
                            <Link to="/dashboard" className="text-primary font-semibold hover:text-primary/80 transition-colors">
                                {t('navbar.dashboard')}
                            </Link>
                        )}

                        {isAdmin && (
                            <Link to="/admin" className="text-warning font-semibold hover:text-warning/80 transition-colors flex items-center gap-1">
                                <Shield className="w-4 h-4" />
                                {t('navbar.admin')}
                            </Link>
                        )}
                    </div>

                    {/* Auth & Lang Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        <ThemeToggle />
                        <LanguageSwitcher />

                        {isAuthenticated ? (
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-primary px-3 py-1 bg-primary/10 rounded-lg">
                                    {user?.username}
                                </span>
                                <button
                                    onClick={() => {
                                        logout();
                                        navigate('/');
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-danger hover:bg-danger/10 rounded-lg transition-all border border-transparent hover:border-danger/20"
                                    title={t('navbar.logout')}
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden lg:inline">{t('navbar.logout')}</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/login" className="text-text-secondary hover:text-text-primary font-medium">{t('navbar.login')}</Link>
                                <Link to="/register"><Button className="!py-1.5 text-sm">{t('navbar.register')}</Button></Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center gap-4">
                        <ThemeToggle />
                        <LanguageSwitcher />
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-text-secondary hover:text-text-primary">
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-background-card border-b border-border">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        <Link to="/pricing" className="block px-3 py-2 text-text-secondary" onClick={() => setIsMenuOpen(false)}>{t('navbar.pricing')}</Link>
                        <Link to="/leaderboard" className="block px-3 py-2 text-text-secondary" onClick={() => setIsMenuOpen(false)}>{t('navbar.leaderboard')}</Link>

                        {isAuthenticated && user?.activeChallenge && (
                            <Link to="/dashboard" className="block px-3 py-2 text-primary font-bold" onClick={() => setIsMenuOpen(false)}>
                                {t('navbar.dashboard')}
                            </Link>
                        )}

                        {isAdmin && (
                            <Link to="/admin" className="block px-3 py-2 text-warning font-bold flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                                <Shield className="w-4 h-4" />
                                {t('navbar.admin')}
                            </Link>
                        )}

                        <div className="pt-4 border-t border-border mt-2">
                            {isAuthenticated ? (
                                <div className="flex flex-col gap-2 p-2">
                                    <div className="px-3 py-2 text-sm font-bold text-primary bg-primary/10 rounded-lg">
                                        {user?.username}
                                    </div>
                                    <button
                                        onClick={() => {
                                            logout();
                                            navigate('/');
                                            setIsMenuOpen(false);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-danger hover:bg-danger/10 rounded-lg transition-all"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {t('navbar.logout')}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 p-2">
                                    <Link to="/login" className="block px-3 py-2 text-text-primary" onClick={() => setIsMenuOpen(false)}>{t('navbar.login')}</Link>
                                    <Link to="/register" className="block px-3 py-2 text-primary font-bold" onClick={() => setIsMenuOpen(false)}>{t('navbar.register')}</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
