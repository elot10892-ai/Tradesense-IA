from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from app import db
from app.models import User, Payment, Challenge, PaymentStatus, PaymentMethod

from app.services.trading_service import create_trading_account
import asyncio
import uuid
from datetime import datetime

# Créer le blueprint pour les paiements
payment_bp = Blueprint('payment', __name__, url_prefix='/api/payment')


@payment_bp.route('/', methods=['GET'])
def payment_health():
    return {'status': 'payment ok'}


@payment_bp.route('/plans', methods=['GET'])
def get_plans():
    """
    Obtenir la liste des plans de paiement disponibles
    - Return: [
        {id: 1, name: "Starter", price: 200, currency: "DH", balance: 5000},
        {id: 2, name: "Pro", price: 500, currency: "DH", balance: 15000},
        {id: 3, name: "Elite", price: 1000, currency: "DH", balance: 50000}
      ]
    """
    try:
        plans = [
            {
                'id': 1,
                'name': 'Starter',
                'price': 200,
                'currency': 'DH',
                'balance': 5000,
                'capital_amount': 5000,
                'description': 'Plan d\'entrée pour débuter le trading'
            },
            {
                'id': 2,
                'name': 'Pro',
                'price': 500,
                'currency': 'DH',
                'balance': 15000,
                'capital_amount': 15000,
                'description': 'Plan intermédiaire pour traders expérimentés'
            },
            {
                'id': 3,
                'name': 'Elite',
                'price': 1000,
                'currency': 'DH',
                'balance': 50000,
                'capital_amount': 50000,
                'description': 'Plan premium pour traders professionnels'
            }
        ]
        
        return jsonify(plans), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération des plans: {str(e)}'}), 500


@payment_bp.route('/checkout', methods=['POST'])
@jwt_required()
def checkout():
    """
    Effectuer un paiement pour un plan
    - Input: {plan_id, payment_method (CMI/Crypto/PayPal)}
    - Simule délai de 2-3 secondes (asyncio.sleep)
    - Crée Payment record avec status="completed"
    - Crée Challenge avec status="active"
    - Return: {success: true, challenge_id, message}
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Valider les champs requis
        if not data or 'plan_id' not in data or 'payment_method' not in data:
            return jsonify({'error': 'Les champs plan_id et payment_method sont requis'}), 400
        
        plan_id = data['plan_id']
        payment_method = data['payment_method']
        
        # Valider le plan_id
        valid_plan_ids = [1, 2, 3]
        if plan_id not in valid_plan_ids:
            return jsonify({'error': 'Plan ID invalide'}), 400
        
        # Valider le mode de paiement
        valid_methods = [PaymentMethod.CMI.value, PaymentMethod.CRYPTO.value, PaymentMethod.PAYPAL.value]
        if payment_method not in valid_methods:
            return jsonify({'error': f'Méthode de paiement invalide. Options valides: {valid_methods}'}), 400
        
        # Trouver l'utilisateur
        user = User.query.filter_by(id=current_user_id).first()
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        # Obtenir les détails du plan
        plans = {
            1: {'name': 'Starter', 'price': 200, 'balance': 5000},
            2: {'name': 'Pro', 'price': 500, 'balance': 15000},
            3: {'name': 'Elite', 'price': 1000, 'balance': 50000}
        }
        
        if plan_id not in plans:
            return jsonify({'error': 'Plan non trouvé'}), 404
        
        plan_details = plans[plan_id]
        
        # Simuler un délai de traitement de 2-3 secondes
        # Note: dans une vraie application, on utiliserait une tâche asynchrone
        # mais ici on fait une simulation simple
        import time
        time.sleep(2)  # Simuler un délai de traitement
        
        # Créer un enregistrement de paiement
        payment = Payment(
            user_id=current_user_id,
            amount=plan_details['price'],
            currency='DH',
            method=payment_method,
            status=PaymentStatus.COMPLETED.value,
            description=f'Paiement pour le plan {plan_details["name"]}'
        )
        
        db.session.add(payment)
        db.session.flush()  # Pour obtenir l'ID avant commit
        
        # Créer un nouveau challenge basé sur le plan sélectionné
        from app.models.challenge import PlanType
        
        plan_types = {
            1: PlanType.STARTER,
            2: PlanType.PRO,
            3: PlanType.ELITE
        }
        
        challenge = Challenge(
            user_id=current_user_id,
            plan_type=plan_types[plan_id].value,
            initial_balance=plan_details['balance'],
            current_balance=plan_details['balance'],
            status='active',  # Explicitly set status
            payment_status=PaymentStatus.COMPLETED.value,
            payment_method=payment_method,
            start_date=datetime.utcnow()
        )
        
        db.session.add(challenge)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'challenge_id': challenge.id,
            'message': f'Paiement pour le plan {plan_details["name"]} effectué avec succès. Challenge créé.'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors du processus de paiement: {str(e)}'}), 500


@payment_bp.route('/history', methods=['GET'])
@jwt_required()
def get_payment_history():
    """
    Obtenir l'historique des paiements de l'utilisateur
    - Return: historique paiements de l'user
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Récupérer l'utilisateur pour vérifier l'accès
        user = User.query.filter_by(id=current_user_id).first()
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        # Récupérer l'historique des paiements de l'utilisateur
        payments = Payment.query.filter_by(user_id=current_user_id).order_by(
            Payment.timestamp.desc()
        ).all()
        
        payment_history = []
        for payment in payments:
            payment_history.append({
                'id': payment.id,
                'amount': payment.amount,
                'currency': payment.currency,
                'method': payment.method,
                'status': payment.status,
                'timestamp': payment.timestamp.isoformat(),
                'description': payment.description
            })
        
        return jsonify({
            'payment_history': payment_history,
            'count': len(payment_history)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la récupération de l\'historique des paiements: {str(e)}'}), 500


def get_paypal_access_token():
    """ Obtenir un access token PayPal """
    from app.models import SystemSetting
    import requests
    from requests.auth import HTTPBasicAuth
    import logging

    client_id = SystemSetting.get('paypal_client_id')
    client_secret = SystemSetting.get('paypal_client_secret')
    mode = SystemSetting.get('paypal_mode', 'sandbox')

    if not client_id or not client_secret:
        return None, "PayPal n'est pas configuré dans les réglages admin"

    base_url = "https://api-m.sandbox.paypal.com" if mode == 'sandbox' else "https://api-m.paypal.com"
    
    try:
        logging.info(f"Tentative de connexion PayPal ({mode})")
        response = requests.post(
            f"{base_url}/v1/oauth2/token",
            auth=HTTPBasicAuth(client_id, client_secret),
            data={"grant_type": "client_credentials"},
            timeout=15
        )
        if response.status_code != 200:
            logging.error(f"PayPal Auth Error: {response.status_code} - {response.text}")
            return None, f"PayPal Auth Error: {response.status_code}"
            
        return response.json()['access_token'], None
    except Exception as e:
        logging.error(f"PayPal Connection Error: {str(e)}")
        return None, f"Erreur de connexion PayPal: {str(e)}"


@payment_bp.route('/paypal', methods=['POST'])
@jwt_required()
def create_paypal_order():
    """
    Initialiser un paiement PayPal
    - Si client_id == 'fake-client-id', on simule le succès immédiatement
    """
    import logging
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'plan_id' not in data:
            return jsonify({'error': 'Le champ plan_id est requis'}), 400
            
        plan_id = int(data['plan_id'])
        
        plans = {
            1: {'name': 'Starter', 'price': 200, 'balance': 5000},
            2: {'name': 'Pro', 'price': 500, 'balance': 15000},
            3: {'name': 'Elite', 'price': 1000, 'balance': 50000}
        }
        
        if plan_id not in plans:
            return jsonify({'error': 'Plan non trouvé'}), 404
            
        plan_details = plans[plan_id]

        # VÉRIFICATION SIMULATION
        from app.models import SystemSetting
        client_id = SystemSetting.get('paypal_client_id')
        
        if client_id == 'fake-client-id':
            logging.info(f"SIMULATION PAYPAL pour l'utilisateur {current_user_id}")
            # Créer le challenge immédiatement
            from app.models.challenge import PlanType
            plan_types = {1: PlanType.STARTER, 2: PlanType.PRO, 3: PlanType.ELITE}
            
            # Créer le paiement
            payment = Payment(
                user_id=current_user_id,
                amount=plan_details['price'],
                currency='USD',
                method=PaymentMethod.PAYPAL.value,
                status=PaymentStatus.COMPLETED.value,
                transaction_id=f"SIM-{uuid.uuid4().hex[:8]}",
                description=f"Simulated PayPal Payment for {plan_details['name']}"
            )
            db.session.add(payment)
            
            challenge = Challenge(
                user_id=current_user_id,
                plan_type=plan_types[plan_id].value,
                initial_balance=plan_details['balance'],
                current_balance=plan_details['balance'],
                status='active',
                payment_status=PaymentStatus.COMPLETED.value,
                payment_method=PaymentMethod.PAYPAL.value,
                start_date=datetime.utcnow()
            )
            db.session.add(challenge)
            db.session.commit()
            
            return jsonify({
                'is_simulated': True,
                'message': 'Paiement PayPal simulé avec succès ✅',
                'challenge_id': challenge.id
            }), 200

        # FLUX RÉEL (si pas fake-client-id)
        access_token, error = get_paypal_access_token()
        if error:
            return jsonify({'error': error}), 400

        mode = SystemSetting.get('paypal_mode', 'sandbox')
        base_url = "https://api-m.sandbox.paypal.com" if mode == 'sandbox' else "https://api-m.paypal.com"

        import requests
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        order_payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "amount": {
                        "currency_code": "USD",
                        "value": str(plan_details['price'])
                    },
                    "description": f"Plan {plan_details['name']} - TradeSense"
                }
            ],
            "application_context": {
                "return_url": request.host_url + "api/payment/paypal/callback?success=true",
                "cancel_url": request.host_url + "api/payment/paypal/callback?success=false",
                "user_action": "PAY_NOW",
                "brand_name": "TradeSense AI"
            }
        }
        
        response = requests.post(f"{base_url}/v2/checkout/orders", json=order_payload, headers=headers)
        
        if response.status_code not in [200, 201]:
            return jsonify({'error': f"PayPal API Error: {response.status_code}"}), 400
            
        order_data = response.json()
        
        payment = Payment(
            user_id=current_user_id,
            amount=plan_details['price'],
            currency='USD',
            method=PaymentMethod.PAYPAL.value,
            status=PaymentStatus.PENDING.value,
            transaction_id=order_data['id'],
            description=f"PayPal Order for {plan_details['name']}"
        )
        db.session.add(payment)
        db.session.commit()
        
        checkout_url = next(link['href'] for link in order_data['links'] if link['rel'] == 'approve')
        
        return jsonify({
            'checkout_url': checkout_url,
            'order_id': order_data['id']
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Internal Error in create_paypal_order: {str(e)}")
        return jsonify({'error': f'Erreur interne: {str(e)}'}), 500


@payment_bp.route('/paypal/callback', methods=['GET'])
def paypal_callback():
    """
    Gérer le retour de PayPal (redirection après approbation)
    """
    token = request.args.get('token') # This is the Order ID in PayPal V2
    success = request.args.get('success') == 'true'
    
    if not success or not token:
        return "Paiement annulé. Vous pouvez fermer cette fenêtre.", 200

    # Rediriger vers une page de succès sur le frontend
    # Le frontend appellera ensuite /capture pour finaliser
    return f"""
    <html>
        <body>
            <h3>Traitement du paiement...</h3>
            <script>
                window.opener.postMessage({{ type: 'PAYPAL_SUCCESS', order_id: '{token}' }}, '*');
                window.close();
            </script>
        </body>
    </html>
    """, 200


@payment_bp.route('/paypal/capture', methods=['POST'])
@jwt_required()
def capture_paypal_payment():
    """
    Capturer le paiement PayPal après approbation de l'utilisateur
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'order_id' not in data:
            return jsonify({'error': 'Order ID manquant'}), 400
            
        order_id = data['order_id']
        
        # Retrouver le paiement en attente
        payment = Payment.query.filter_by(transaction_id=order_id).first()
        if not payment:
            return jsonify({'error': 'Paiement non trouvé'}), 404
            
        if payment.status == PaymentStatus.COMPLETED.value:
            return jsonify({'message': 'Paiement déjà capturé', 'success': True}), 200

        # Obtenir le token PayPal
        access_token, error = get_paypal_access_token()
        if error:
            return jsonify({'error': f"Erreur PayPal: {error}"}), 500

        from app.models import SystemSetting
        mode = SystemSetting.get('paypal_mode', 'sandbox')
        base_url = "https://api-m.sandbox.paypal.com" if mode == 'sandbox' else "https://api-m.paypal.com"

        # Capturer l'ordre
        import requests
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.post(f"{base_url}/v2/checkout/orders/{order_id}/capture", json={}, headers=headers)
        
        if response.status_code != 201 and response.status_code != 200:
            payment.status = PaymentStatus.FAILED.value
            db.session.commit()
            return jsonify({'error': 'Échec de la capture du paiement'}), 400
            
        capture_data = response.json()
        
        if capture_data.get('status') == 'COMPLETED':
            # Confirmer le paiement
            payment.status = PaymentStatus.COMPLETED.value
            
            # Créer le challenge
            # Note: on doit retrouver quel challenge/plan était prévu
            # On va déduire le plan du prix (simple pour la démo)
            price_to_plan = {200: 1, 500: 2, 1000: 3}
            plan_id = price_to_plan.get(int(payment.amount), 1)
            
            plans = {
                1: {'name': 'Starter', 'balance': 5000},
                2: {'name': 'Pro', 'balance': 15000},
                3: {'name': 'Elite', 'balance': 50000}
            }
            plan_details = plans[plan_id]
            
            from app.models.challenge import PlanType
            plan_types = {1: PlanType.STARTER, 2: PlanType.PRO, 3: PlanType.ELITE}
            
            challenge = Challenge(
                user_id=current_user_id,
                plan_type=plan_types[plan_id].value,
                initial_balance=plan_details['balance'],
                current_balance=plan_details['balance'],
                status='active',
                payment_status=PaymentStatus.COMPLETED.value,
                payment_method=PaymentMethod.PAYPAL.value,
                start_date=datetime.utcnow()
            )
            
            db.session.add(challenge)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Paiement effectué avec succès',
                'challenge_id': challenge.id
            }), 200
        else:
            payment.status = PaymentStatus.FAILED.value
            db.session.commit()
            return jsonify({'error': 'Le paiement n\'a pas été complété'}), 400
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors de la capture: {str(e)}'}), 500
