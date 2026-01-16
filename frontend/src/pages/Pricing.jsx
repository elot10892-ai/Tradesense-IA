import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Loader2, Sparkles, Shield } from 'lucide-react';
import apiPayment from '../api/apiPayment';
import Button from '../components/common/Button';

const PricingCard = ({ plan, onSelect }) => {
    const { t } = useTranslation();
    const isPopular = plan.name === 'Pro';

    const features = [
        `${t('pricing.features.target')}: ${plan.target_profit || 10}%`,
        `${t('pricing.features.drawdown')}: ${plan.max_drawdown || 10}%`,
        `${t('pricing.features.daily')}: ${plan.daily_loss || 5}%`,
        t('pricing.features.leverage'),
        t('pricing.features.support'),
        t('pricing.features.news')
    ];

    return (
        <div className={`relative p-8 rounded-2xl border ${isPopular ? 'border-primary bg-background-card/80 shadow-[0_0_40px_rgba(240,185,11,0.1)]' : 'border-border bg-background-card'} flex flex-col hover:-translate-y-2 transition-transform duration-300`}>
            {isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-black text-sm font-bold px-4 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {t('pricing.popular')}
                </div>
            )}

            <div className="mb-8 text-center">
                <h3 className="text-2xl font-bold text-text-primary mb-2">{plan.name} Challenge</h3>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-text-primary">${plan.price}</span>
                    <span className="text-text-secondary">{t('pricing.per_month')}</span>
                </div>
                <p className="text-primary font-medium mt-2">
                    {t('pricing.capital')}: ${((plan.capital_amount || plan.balance || 0) / 1000).toLocaleString()}k
                </p>
            </div>

            <div className="flex-grow space-y-4 mb-8">
                {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-success" />
                        </div>
                        <span className="text-text-secondary text-sm">{feature}</span>
                    </div>
                ))}
            </div>

            <Button
                onClick={() => onSelect(plan)}
                className={`w-full py-4 font-bold text-lg ${isPopular ? 'bg-primary text-black hover:bg-primary/90' : 'bg-secondary text-text-primary hover:opacity-90'}`}
            >
                {t('pricing.choose_plan')}
            </Button>
        </div>
    );
};

const Pricing = () => {
    const { t } = useTranslation();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const data = await apiPayment.getPlans();
                setPlans(data);
            } catch (err) {
                console.warn("API plans non dispo, utilisation mock");
                // Mock fallback
                setPlans([
                    { id: 1, name: 'Starter', price: 200, capital_amount: 5000 },
                    { id: 2, name: 'Pro', price: 500, capital_amount: 15000 },
                    { id: 3, name: 'Elite', price: 1000, capital_amount: 50000 }
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleSelectPlan = (plan) => {
        navigate('/checkout', { state: { plan } });
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                        <Shield className="w-4 h-4" />
                        {t('pricing.funded_badge')}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('pricing.title')}</h1>
                    <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                        {t('pricing.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {plans.map((plan) => (
                        <PricingCard key={plan.id} plan={plan} onSelect={handleSelectPlan} />
                    ))}
                </div>

                <div className="mt-20 text-center border-t border-border pt-10">
                    <p className="text-text-secondary text-sm">
                        {t('pricing.terms')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
