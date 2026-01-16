# 🔐 Guide d'Accès au Panel Admin TradeSense

## ✅ Compte Admin Par Défaut Créé

Un compte administrateur a été créé avec les identifiants suivants :

```
📧 Email: admin@tradesense.com
🔑 Mot de passe: Admin123!
👤 Rôle: admin
```

---

## 🚀 Comment Se Connecter

### Étape 1 : Connexion
1. Ouvrez votre navigateur
2. Allez sur : **http://localhost:5173/login**
3. Entrez les identifiants :
   - Email : `admin@tradesense.com`
   - Mot de passe : `Admin123!`
4. Cliquez sur **Login**

### Étape 2 : Accès au Panel Admin
Deux options :

**Option A - Via l'URL directe :**
- Allez sur : **http://localhost:5173/admin**

**Option B - Via la Navbar :**
- Une fois connecté, vous verrez un lien **"Admin Panel"** (🛡️) dans la barre de navigation
- Cliquez dessus pour accéder au panel

---

## 🎯 Fonctionnalités du Panel Admin

### 📊 Onglet "Utilisateurs"
- **Liste complète** de tous les utilisateurs
- **Recherche** par nom ou email
- **Informations affichées** :
  - Nom d'utilisateur
  - Email
  - Rôle (user/admin/superadmin)
  - Statut (Actif/Inactif)
  - Date de création

### 🏆 Onglet "Challenges"
- **Liste de tous les challenges** avec :
  - ID du challenge
  - Nom de l'utilisateur
  - Plan (capital initial)
  - Capital actuel
  - Profit/Loss (P/L)
  - Statut (EN COURS / RÉUSSI / ÉCHOUÉ)

- **Actions disponibles** :
  - ✅ **Marquer comme réussi** - Valide le challenge
  - ❌ **Marquer comme échoué** - Marque le challenge comme échoué
  - 🔄 **Rafraîchissement automatique** après chaque action

### 📈 Statistiques Rapides
- **Total Utilisateurs** - Nombre total d'utilisateurs inscrits
- **Challenges Actifs** - Nombre de challenges en cours
- **Revenu Total** - Somme de tous les paiements complétés

---

## 🛠️ Scripts Utilitaires

### Créer un nouveau compte admin
```bash
cd backend
python create_default_admin.py
```

### Promouvoir un utilisateur existant
```bash
cd backend
python make_admin.py <email_ou_username>
```

### Lister tous les utilisateurs
```bash
cd backend
python make_admin.py list
```

### Promouvoir en superadmin
```bash
cd backend
python make_admin.py <email_ou_username> super
```

---

## 🔒 Sécurité

- ✅ **Protection par rôle** - Seuls les utilisateurs avec rôle `admin` ou `superadmin` peuvent accéder
- ✅ **Vérification JWT** - Token vérifié à chaque requête
- ✅ **Redirection automatique** - Les non-admins sont redirigés vers le dashboard
- ✅ **Messages d'erreur clairs** - En cas d'accès refusé

---

## 🎨 Interface

- **Design moderne** conservé à l'identique
- **Indicateurs de chargement** pendant les requêtes
- **Messages d'erreur visuels** en cas de problème
- **Bouton de rafraîchissement** pour recharger les données
- **États vides** quand aucune donnée n'est disponible
- **Recherche en temps réel** pour les utilisateurs

---

## 📝 Notes Importantes

1. **Les actions admin sont immédiates** - Quand vous validez/échouez un challenge, la base de données est mise à jour instantanément
2. **Impact sur les utilisateurs** - Les utilisateurs verront le nouveau statut sur leur dashboard
3. **Aucune donnée mockée** - Toutes les données proviennent du backend réel
4. **Comportement professionnel** - Conforme aux standards d'une Prop Firm

---

## 🆘 Dépannage

### Je ne vois pas le lien "Admin Panel" dans la navbar
- Vérifiez que vous êtes connecté avec le compte admin
- Le lien n'apparaît que pour les utilisateurs avec rôle `admin` ou `superadmin`

### Erreur "Accès refusé"
- Vérifiez que votre compte a bien le rôle `admin`
- Utilisez le script `make_admin.py` pour promouvoir votre compte

### Les données ne se chargent pas
- Vérifiez que le backend est en cours d'exécution (`python app.py`)
- Vérifiez la console du navigateur pour les erreurs
- Vérifiez que vous avez un token valide (localStorage)

---

## ✨ Prochaines Étapes

Vous pouvez maintenant :
1. ✅ Gérer tous les utilisateurs de la plateforme
2. ✅ Valider ou refuser les challenges
3. ✅ Voir les statistiques en temps réel
4. ✅ Rechercher des utilisateurs spécifiques
5. ✅ Rafraîchir les données à tout moment

**Le panel admin est 100% opérationnel ! 🚀**
