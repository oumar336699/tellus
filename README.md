# TELLUS - Application Mobile de Gestion Foncière

Application mobile de gestion des rendez-vous et de suivi des dossiers fonciers pour la Délégation des Domaines, du Cadastre et des Affaires Foncières de Garoua, Cameroun.

**Version :** 2.0  
**Zone :** Garoua, Région du Nord, Cameroun  
**Année :** 2026

---

## 📋 Table des matières

- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Lancement](#lancement)
- [Développement](#développement)
- [Structure du projet](#structure-du-projet)
- [Modules IA](#modules-ia)
- [API](#api)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [Support](#support)

---

## 🎯 Présentation

TELLUS est une application mobile qui permet aux citoyens de:

- 📅 Prendre rendez-vous en ligne sans se déplacer
- 📁 Déposer et suivre leurs dossiers fonciers en temps réel
- 📋 Connaître à l'avance les pièces à fournir, le prix et le délai
- 🤖 Vérifier la conformité de leur dossier grâce à l'Intelligence Artificielle
- 🔔 Recevoir des notifications à chaque étape

L'application est divisée en trois espaces distincts:

- **Usager** : pour les citoyens
- **Agent** : pour les employés de la Délégation
- **Super Admin** : pour le responsable de la supervision

---

## ✨ Fonctionnalités

### Espace Usager
- ✅ Connexion avec empreinte digitale (biométrie)
- ✅ Prise de rendez-vous en ligne
- ✅ Consultation des documents à fournir par procédure
- ✅ Visualisation du score de validité IA (0-100%)
- ✅ Suivi des dossiers en temps réel
- ✅ Complément automatique des dossiers incomplets
- ✅ Notifications personnalisées
- ✅ Chatbot IA pour les questions procédurales
- ✅ Historique des dossiers (avant et après inscription)

### Espace Agent
- ✅ Validation des comptes par le Super Admin
- ✅ Traitement des dossiers assignés
- ✅ Demande de compléments automatisée
- ✅ Visualisation du score IA et des anomalies
- ✅ Recommandations IA pour la décision
- ✅ Historique des traitements
- ✅ Gestion des rendez-vous

### Espace Super Admin
- ✅ Création du compte avec signature numérique
- ✅ Gestion des agents (validation, rejet)
- ✅ Gestion des services
- ✅ Assignation des dossiers aux services
- ✅ Paramétrage des procédures et seuils IA
- ✅ Supervision statistique du score IA
- ✅ Journaux d'audit exportables
- ✅ Génération de rapports

### Modules IA
- 🤖 **Chatbot RAG** : Répond aux questions procédurales
- 🔍 **OCR** : Lecture automatique des documents
- 📊 **Score de validité IA** : Évalue la conformité du dossier (0-100%)
- 🧠 **Aide à la décision** : Détecte anomalies, résume le dossier, estime le délai

---

## 🏗️ Architecture

```
TELLUS/
├── frontend/              # Application mobile (Capacitor)
│   ├── www/
│   │   ├── index.html    # Page principale
│   │   ├── css/          # Styles
│   │   ├── js/           # Scripts JavaScript
│   │   └── assets/       # Images et icônes
│   ├── capacitor.config.json
│   └── package.json
├── backend/              # API REST (Node.js/Express)
│   ├── src/
│   │   ├── controllers/  # Contrôleurs
│   │   ├── models/       # Modèles Mongoose
│   │   ├── routes/       # Routes Express
│   │   ├── middleware/   # Middleware
│   │   ├── services/     # Services métier
│   │   ├── utils/        # Utilitaires
│   │   └── server.js     # Point d'entrée
│   ├── config/           # Configuration
│   └── package.json
├── database/             # Scripts de base de données
├── docs/                 # Documentation
└── assets/               # Assets partagés
```

---

## 📦 Prérequis

### Pour le frontend
- Node.js (>= 16.0.0)
- npm (>= 8.0.0)
- Capacitor CLI
- Android Studio (pour la build Android)

### Pour le backend
- Node.js (>= 16.0.0)
- npm (>= 8.0.0)
- MongoDB (>= 4.4)
- Python (pour certaines dépendances IA)

### Pour les modules IA
- Clé API OpenAI (pour ChatGPT)
- Tesseract.js (pour OCR)
- LangChain (pour RAG)

---

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/your-org/tellus.git
cd tellus
```

### 2. Installer le backend

```bash
cd backend
npm install
cp .env.example .env
```

### 3. Configurer le backend

Éditez le fichier `.env` avec vos configurations:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tellus
JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_openai_key
```

### 4. Installer le frontend

```bash
cd ../frontend
npm install
```

### 5. Configurer Capacitor

```bash
npm install @capacitor/cli @capacitor/android
npx cap init
npx cap add android
```

### 6. Démarrer MongoDB

```bash
# Sur Linux/Mac
sudo systemctl start mongod

# Sur Windows
net start MongoDB
```

### 7. Initialiser la base de données

```bash
cd backend
node src/database/init.js
```

---

## ⚙️ Configuration

### Backend (.env)

```env
# Serveur
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:8100

# Base de données
MONGODB_URI=mongodb://localhost:27017/tellus

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d

# IA
OPENAI_API_KEY=your_openai_api_key
AI_SCORE_THRESHOLD=90
AI_SCORE_WARNING=70

# Fichiers
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### Frontend (capacitor.config.json)

```json
{
  "appId": "com.tellus.foncier",
  "appName": "TELLUS",
  "webDir": "www",
  "server": {
    "androidScheme": "https"
  }
}
```

---

## 🎬 Lancement

### Démarrer le backend

```bash
cd backend
npm run dev
```

L'API sera disponible sur `http://localhost:3000`

### Démarrer le frontend

```bash
cd frontend
npm start
```

L'application sera disponible sur `http://localhost:8100`

### Build Android

```bash
cd frontend
npm run build
npx cap open android
```

---

## 💻 Développement

### Scripts utiles

**Backend:**
```bash
npm run dev      # Mode développement avec nodemon
npm start        # Mode production
npm test         # Exécuter les tests
npm run lint     # Linter ESLint
```

**Frontend:**
```bash
npm start        # Démarrer le serveur de développement
npm run build    # Build pour production
npm run sync     # Synchroniser avec Capacitor
```

### Convention de code

- JavaScript ES6+
- camelCase pour les variables et fonctions
- PascalCase pour les classes et modèles
- Commentaires JSDoc pour les fonctions

### Git workflow

1. Créer une branche pour votre fonctionnalité
2. Faire vos modifications
3. Tester localement
4. Commit avec des messages clairs
5. Push et créer une Pull Request

---

## 📁 Structure du projet

### Frontend

```
frontend/
├── www/
│   ├── index.html
│   ├── css/
│   │   ├── styles.css        # Styles principaux
│   │   ├── animations.css    # Animations
│   │   └── responsive.css   # Design responsive
│   ├── js/
│   │   ├── app.js            # Application principale
│   │   ├── auth.js           # Authentification
│   │   ├── user.js           # Espace Usager
│   │   ├── agent.js          # Espace Agent
│   │   ├── admin.js          # Espace Super Admin
│   │   ├── ai.js             # Modules IA
│   │   ├── offline.js        # Gestion hors-ligne
│   │   ├── i18n.js           # Internationalisation
│   │   └── signature.js      # Signature numérique
│   └── assets/
│       ├── icons/
│       └── images/
├── capacitor.config.json
└── package.json
```

### Backend

```
backend/
├── src/
│   ├── controllers/
│   ├── models/
│   │   ├── User.js
│   │   ├── Agent.js
│   │   ├── Admin.js
│   │   ├── Service.js
│   │   ├── File.js
│   │   ├── Appointment.js
│   │   └── Procedure.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── agent.js
│   │   ├── admin.js
│   │   ├── ai.js
│   │   ├── procedures.js
│   │   └── files.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── notFoundHandler.js
│   ├── services/
│   ├── utils/
│   └── server.js
├── config/
│   └── database.js
└── package.json
```

---

## 🤖 Modules IA

### Chatbot RAG
- Répond aux questions sur les procédures
- Utilise LangChain et OpenAI
- Base de connaissances sur les procédures foncières

### OCR
- Extraction de texte des documents
- Utilise Tesseract.js
- Supporte PDF, JPEG, PNG

### Score de validité IA
- Évalue la conformité du dossier (0-100%)
- Analyse les documents manquants
- Vérifie la qualité des documents
- Détecte les incohérences

### Aide à la décision
- Résume le dossier
- Détecte les anomalies
- Estime le délai de traitement
- Fournit des recommandations

---

## 🔌 API

### Endpoints principaux

#### Authentification
- `POST /api/auth/user/login` - Connexion usager
- `POST /api/auth/agent/login` - Connexion agent
- `POST /api/auth/admin/login` - Connexion Super Admin
- `POST /api/auth/change-password` - Changement mot de passe

#### Usager
- `GET /api/user/profile` - Profil usager
- `GET /api/user/appointments` - Rendez-vous
- `POST /api/user/appointments` - Créer rendez-vous
- `GET /api/user/files` - Dossiers
- `POST /api/user/files` - Créer dossier
- `POST /api/user/files/:id/submit` - Soumettre dossier

#### Agent
- `GET /api/agent/profile` - Profil agent
- `GET /api/agent/files` - Dossiers assignés
- `POST /api/agent/files/:id/validate` - Valider dossier
- `POST /api/agent/files/:id/reject` - Rejeter dossier
- `POST /api/agent/files/:id/complement` - Demander complément

#### Super Admin
- `GET /api/admin/agents` - Liste agents
- `POST /api/admin/agents` - Créer agent
- `POST /api/admin/agents/:id/validate` - Valider agent
- `GET /api/admin/services` - Liste services
- `GET /api/admin/supervision` - Statistiques IA
- `GET /api/admin/logs` - Journaux d'audit

#### IA
- `POST /api/ai/ocr` - Traitement OCR
- `POST /api/ai/score` - Calcul score IA
- `POST /api/ai/chatbot` - Chatbot
- `GET /api/ai/decision-support/:fileId` - Support décision

Documentation complète de l'API : `http://localhost:3000/api`

---

## 🧪 Tests

### Exécuter les tests

```bash
cd backend
npm test
```

### Tests de frontend

```bash
cd frontend
npm test
```

---

## 📦 Déploiement

### Backend

```bash
cd backend
npm run build
pm2 start src/server.js
```

### Frontend

```bash
cd frontend
npm run build
npx cap sync android
npx cap open android
```

### Variables d'environnement de production

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://production-server:27017/tellus
JWT_SECRET=your_production_secret
```

---

## 📞 Support

### Contact

- **Email** : support@tellus.cm
- **Téléphone** : +237 XX XX XX XX
- **Adresse** : Délégation des Domaines, Garoua
- **Horaires** : Lundi – Vendredi · 08h00 – 16h00

### Documentation

- Guide d'utilisation : `docs/GUIDE_UTILISATION.md`
- Documentation API : `docs/API.md`
- Guide de développement : `docs/DEVELOPMENT.md`

---

## 📄 Licence

MIT

---

## 👥 Contributeurs

- TELLUS Team
- Délégation des Domaines, du Cadastre et des Affaires Foncières
- Garoua, Cameroun

---

## 🙏 Remerciements

- Capacitor Team
- Express.js Community
- MongoDB Inc.
- OpenAI

---

**© 2026 — Délégation des Domaines, du Cadastre et des Affaires Foncières · Garoua · Cameroun**