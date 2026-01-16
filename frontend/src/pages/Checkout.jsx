import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Bitcoin, Wallet, Loader2, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import api from '../api/axios';
import Button from '../components/common/Button';

const PaymentMethod = ({ icon: Icon, title, description, selected, onSelect }) => (
    <div
        onClick={onSelect}
        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 hover:bg-secondary/20 ${selected ? 'border-primary bg-primary/10' : 'border-border bg-background-card'}`}
    >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selected ? 'bg-primary text-black' : 'bg-background-input text-text-secondary'}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <h4 className={`font-bold ${selected ? 'text-primary' : 'text-text-primary'}`}>{title}</h4>
            <p className="text-sm text-text-secondary">{description}</p>
        </div>
        {selected && <CheckCircle2 className="w-6 h-6 text-primary ml-auto" />}
    </div>
);

const Checkout = () => {
    const { t } = useTranslation();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { refreshProfile } = useAuth();

    const [selectedMethod, setSelectedMethod] = useState('CMI');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Redirect if no plan selected
    if (!state?.plan) {
        return <Navigate to="/pricing" replace />;
    }

    const { plan } = state;

    const handlePayment = async (e) => {
        if (e) e.preventDefault();

        setIsProcessing(true);
        setError(null);

        try {
            if (selectedMethod === 'PayPal') {
                const response = await api.post('/api/payment/paypal', { plan_id: plan.id });

                if (response.data.is_simulated) {
                    setIsSuccess(true);
                    // On peut écraser le message de succès par défaut si on veut
                    setTimeout(() => {
                        refreshProfile();
                        navigate('/dashboard', { state: { newSubscription: true } });
                    }, 2000);
                    return;
                }

                if (response.data.checkout_url) {
                    // Ouvrir PayPal dans une nouvelle fenêtre
                    const width = 600, height = 700;
                    const left = (window.innerWidth - width) / 2;
                    const top = (window.innerHeight - height) / 2;
                    const paypalPopup = window.open(
                        response.data.checkout_url,
                        'PayPal',
                        `width=${width},height=${height},top=${top},left=${left}`
                    );

                    // Écouter le message de succès du popup
                    const handleMessage = async (event) => {
                        if (event.data.type === 'PAYPAL_SUCCESS') {
                            window.removeEventListener('message', handleMessage);
                            payPalCapture(event.data.order_id);
                        }
                    };
                    window.addEventListener('message', handleMessage);

                    // Vérifier si le popup est fermé manuellement
                    const checkClosed = setInterval(() => {
                        if (paypalPopup.closed) {
                            clearInterval(checkClosed);
                            if (!isSuccess) setIsProcessing(false);
                        }
                    }, 1000);

                    return; // On attend le message du popup
                }
            } else {
                const response = await api.post('/api/payment/checkout', {
                    plan_id: plan.id,
                    payment_method: selectedMethod
                });

                if (response.data.success === true) {
                    const updatedUser = await refreshProfile();
                    if (updatedUser && updatedUser.activeChallenge) {
                        setIsSuccess(true);
                        setTimeout(() => {
                            navigate('/dashboard', { state: { newSubscription: true } });
                        }, 2000);
                    } else {
                        setError("Paiement réussi mais échec de l'activation immédiate du challenge. Veuillez contacter le support.");
                    }
                } else {
                    setError(response.data.message || t('common.error'));
                }
            }

        } catch (err) {
            console.error("Payment failed", err);
            const msg = err.response?.data?.message || err.response?.data?.error || t('common.error');
            setError(msg);
            setIsProcessing(false);
        }
    };

    const payPalCapture = async (orderId) => {
        try {
            const captureRes = await api.post('/api/payment/paypal/capture', { order_id: orderId });
            if (captureRes.data.success) {
                await refreshProfile();
                setIsSuccess(true);
                setTimeout(() => {
                    navigate('/dashboard', { state: { newSubscription: true } });
                }, 2000);
            } else {
                setError("Échec de la capture du paiement PayPal.");
                setIsProcessing(false);
            }
        } catch (err) {
            setError(err.response?.data?.error || "Erreur lors de la capture du paiement");
            setIsProcessing(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
                <div className="text-center bg-background-card p-10 rounded-2xl border border-success/30 shadow-[0_0_50px_rgba(14,203,129,0.2)] max-w-md w-full animate-fade-in">
                    <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-text-primary mb-2">{t('checkout.success_title')}</h2>
                    <p className="text-text-secondary mb-6">
                        {selectedMethod === 'PayPal' && !isProcessing ? 'Paiement PayPal simulé avec succès ✅' : t('checkout.success_msg')}
                    </p>
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-success" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">{t('checkout.title')}</h1>

                {error && (
                    <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg text-danger">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-background-card p-6 rounded-2xl border border-border">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-primary" />
                                {t('checkout.payment_method')}
                            </h3>
                            <div className="space-y-3">
                                <PaymentMethod
                                    icon={CreditCard}
                                    title={t('checkout.methods.cmi')}
                                    description={t('checkout.methods.cmi_desc')}
                                    selected={selectedMethod === 'CMI'}
                                    onSelect={() => setSelectedMethod('CMI')}
                                />
                                <PaymentMethod
                                    icon={Bitcoin}
                                    title={t('checkout.methods.crypto')}
                                    description={t('checkout.methods.crypto_desc')}
                                    selected={selectedMethod === 'Crypto'}
                                    onSelect={() => setSelectedMethod('Crypto')}
                                />
                                <PaymentMethod
                                    icon={Wallet}
                                    title={t('checkout.methods.paypal')}
                                    description={t('checkout.methods.paypal_desc')}
                                    selected={selectedMethod === 'PayPal'}
                                    onSelect={() => setSelectedMethod('PayPal')}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-background-card p-6 rounded-2xl border border-border sticky top-24">
                            <h3 className="text-xl font-bold mb-6">{t('checkout.summary')}</h3>
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
                                <div className="text-text-secondary">Challenge {plan.name}</div>
                                <div className="font-bold text-text-primary">${plan.price.toFixed(2)}</div>
                            </div>
                            <div className="flex justify-between items-center mb-8">
                                <div className="font-bold text-xl">{t('checkout.total')}</div>
                                <div className="font-bold text-2xl text-primary">${plan.price.toFixed(2)}</div>
                            </div>
                            <Button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="w-full py-4 bg-primary text-black font-bold hover:bg-primary/90"
                            >
                                {isProcessing ? t('checkout.processing') : `${t('checkout.pay')} $${plan.price}`}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
