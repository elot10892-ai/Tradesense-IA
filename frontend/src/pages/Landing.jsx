import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Bot, Globe, Users, GraduationCap, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import Button from '../components/common/Button';
import LiveTicker from '../components/common/LiveTicker';

const FeatureCard = ({ icon: Icon, title, description, colorClass = "text-primary" }) => (
    <div className="p-6 rounded-xl bg-background-card border border-border hover:border-primary/50 transition-all hover:shadow-card group hover:-translate-y-1">
        <div className={`w-12 h-12 rounded-lg bg-background-input flex items-center justify-center mb-4 group-hover:bg-secondary transition-colors`}>
            <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
        <h3 className="text-xl font-bold mb-3 text-text-primary">{title}</h3>
        <p className="text-text-secondary leading-relaxed">{description}</p>
    </div>
);

const Landing = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen flex flex-col font-primary">
            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[400px] bg-accent/10 rounded-full blur-[100px] -z-10" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-primary/30 bg-primary/10 text-primary font-medium text-sm animate-fade-in">
                        {t('landing.badge')}
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                        {t('landing.hero_title')} <br />
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            TradeSense AI
                        </span>
                    </h1>

                    <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
                        {t('landing.hero_subtitle')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/pricing">
                            <button className="px-8 py-4 rounded-lg font-bold text-black bg-primary hover:bg-primary/90 transition-all transform hover:scale-105 shadow-glow-green flex items-center gap-2">
                                {t('landing.cta_start')} <ArrowRight className="w-5 h-5" />
                            </button>
                        </Link>
                        <Link to="/leaderboard">
                            <button className="px-8 py-4 rounded-lg font-bold text-text-primary bg-secondary hover:opacity-90 border border-border transition-all flex items-center gap-2">
                                {t('landing.cta_leaderboard')} <TrendingUp className="w-5 h-5" />
                            </button>
                        </Link>
                    </div>

                    {/* Stats quick view */}
                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-border pt-8 max-w-4xl mx-auto">
                        <div>
                            <div className="text-3xl font-bold text-text-primary">$10M+</div>
                            <div className="text-sm text-text-secondary">{t('landing.stats.payout')}</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-text-primary">50K+</div>
                            <div className="text-sm text-text-secondary">{t('landing.stats.traders')}</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-text-primary">120+</div>
                            <div className="text-sm text-text-secondary">{t('landing.stats.countries')}</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-text-primary">24/7</div>
                            <div className="text-sm text-text-secondary">{t('landing.stats.support')}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Live Ticker - Public access to real prices */}
            <LiveTicker />

            {/* Features Grid */}
            <section className="py-24 bg-background/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">{t('landing.features_title')}</h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            {t('landing.features_subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard
                            icon={Bot}
                            title={t('landing.feature_1_title')}
                            description={t('landing.feature_1_desc')}
                            colorClass="text-primary"
                        />
                        <FeatureCard
                            icon={Globe}
                            title={t('landing.feature_2_title')}
                            description={t('landing.feature_2_desc')}
                            colorClass="text-accent"
                        />
                        <FeatureCard
                            icon={Users}
                            title={t('landing.feature_3_title')}
                            description={t('landing.feature_3_desc')}
                            colorClass="text-success"
                        />
                        <FeatureCard
                            icon={GraduationCap}
                            title={t('landing.feature_4_title')}
                            description={t('landing.feature_4_desc')}
                            colorClass="text-warning"
                        />
                    </div>
                </div>
            </section>

            {/* Why TradeSense */}
            <section className="py-24 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">
                                {t('landing.why_title')} <span className="text-primary">TradeSense</span> ?
                            </h2>
                            <div className="space-y-6">
                                {[
                                    { title: t('landing.why_feature_1_title'), desc: t('landing.why_feature_1_desc') },
                                    { title: t('landing.why_feature_2_title'), desc: t('landing.why_feature_2_desc') },
                                    { title: t('landing.why_feature_3_title'), desc: t('landing.why_feature_3_desc') },
                                ].map((item, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="mt-1 bg-secondary p-2 rounded-lg h-fit">
                                            <ShieldCheck className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-text-primary mb-2">{item.title}</h4>
                                            <p className="text-text-secondary">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10">
                                <Link to="/pricing">
                                    <Button className="!px-8 !py-3 bg-primary text-black hover:opacity-90">
                                        {t('landing.why_cta')}
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent blur-3xl -z-10" />
                            <div className="bg-background-card border border-border rounded-2xl p-6 shadow-2xl skew-y-3 transform hover:skew-y-0 transition-all duration-500">
                                {/* Mockup simpliste d'un chart/dashboard */}
                                <div className="flex justify-between items-center mb-6">
                                    <div className="h-4 w-32 bg-secondary rounded" />
                                    <div className="h-8 w-24 bg-success/20 text-success rounded flex items-center justify-center font-bold">+24.5%</div>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-32 bg-gradient-to-t from-primary/10 to-transparent rounded-lg border-b-2 border-primary relative overflow-hidden">
                                        {/* Fake chart line */}
                                        <svg className="absolute bottom-0 w-full h-full" overflow="visible">
                                            <path d="M0 100 Q 50 50, 100 80 T 200 40 T 300 60 T 400 20" fill="none" stroke="var(--color-primary)" strokeWidth="3" />
                                        </svg>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="h-16 bg-background-input rounded animate-pulse" />
                                        <div className="h-16 bg-background-input rounded animate-pulse delay-75" />
                                        <div className="h-16 bg-background-input rounded animate-pulse delay-150" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 -z-10" />
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-4xl md:text-6xl font-bold mb-6">{t('landing.cta_final_title')}</h2>
                    <p className="text-xl text-text-secondary mb-10">
                        {t('landing.cta_final_desc')}
                    </p>
                    <Link to="/pricing">
                        <button className="px-12 py-5 rounded-lg text-lg font-bold text-black bg-primary hover:bg-primary/90 hover:scale-105 transition-all shadow-[0_0_30px_rgba(240,185,11,0.3)]">
                            {t('landing.cta_start')}
                        </button>
                    </Link>
                </div>
            </section>

            {/* Simple Footer */}
            <footer className="bg-background-card py-12 border-t border-border">
                <div className="max-w-7xl mx-auto px-4 text-center text-text-secondary">
                    <p>{t('landing.footer')}</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
