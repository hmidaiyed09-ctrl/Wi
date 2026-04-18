# Wi — Application de Quiz Intelligente

**Wi** est une application mobile et web de quiz alimentée par l'intelligence artificielle. Elle permet aux utilisateurs de tester leurs connaissances sur différentes catégories grâce à des questions générées dynamiquement par un modèle IA.

---

## 📋 Sprint Réalisé

### Sprint 1 — Refonte Complète de l'Interface & Système de Catégories

**Durée :** 1 sprint  
**Objectif :** Transformer l'expérience utilisateur du mode solo, mettre en place un système de catégories intelligent, centraliser les paramètres, et offrir un tableau de bord avec des statistiques réelles.

---

## 📖 User Stories

### US-1 : Refonte du Builder en "Game Room" (Mode Solo)

**En tant qu'** utilisateur,  
**je veux** accéder à un écran de configuration de quiz avec un design immersif de type "salle de jeu",  
**afin de** me sentir dans une ambiance de jeu captivante avant de lancer mon quiz.

**Critères d'acceptation :**
- ✅ L'écran de configuration (builder) utilise un fond sombre (`#1B1D2A`) avec des cartes et éléments lumineux
- ✅ Le titre affiché est "Game Room" avec un sous-titre "Set up your quiz challenge"
- ✅ Les boutons de sélection du nombre de questions sont des cercles avec un effet de lueur orange lorsqu'ils sont actifs
- ✅ Les boutons de difficulté (EASY, MEDIUM, HARD) sont affichés en mode pilules horizontales sur fond sombre
- ✅ Le bouton "Start Quiz" est en orange vif (`#FF8C00`) avec une ombre portée lumineuse
- ✅ Le bouton "← Back" permet de revenir à l'écran d'accueil

---

### US-2 : Système de Catégories Prédéfinies et Personnalisées

**En tant qu'** utilisateur,  
**je veux** choisir une catégorie de quiz parmi des catégories prédéfinies ou saisir un sujet personnalisé,  
**afin de** jouer sur des thèmes précis sans devoir toujours rédiger un sujet manuellement.

**Critères d'acceptation :**
- ✅ 6 catégories sont affichées sous forme de grille 2×3 avec des icônes emoji :
  - 🎬 **Entertainment** (Divertissement)
  - ⚽ **Sports**
  - 🧠 **General Knowledge** (Culture Générale)
  - 🔬 **Science**
  - 📜 **History** (Histoire)
  - ✏️ **Custom** (Personnalisé)
- ✅ La catégorie sélectionnée est mise en surbrillance (fond orange)
- ✅ Le champ de saisie "Main topic or formula" n'apparaît **que** lorsque la catégorie "Custom" est sélectionnée
- ✅ Pour les catégories prédéfinies, le sujet est automatiquement défini (ex : "Entertainment, movies, music, TV shows, celebrities, pop culture")

---

### US-3 : Suppression du Choix de Mode de Quiz

**En tant qu'** utilisateur,  
**je veux** ne plus être confronté au choix du "Quiz Mode" (General / Key Facts / Custom),  
**afin d'** avoir une interface simplifiée et moins chargée.

**Critères d'acceptation :**
- ✅ Le sélecteur "Choose quiz mode" a été entièrement supprimé de l'écran builder
- ✅ Le type `QuizMode` et la constante `QUIZ_MODE_LABELS` ont été supprimés du code
- ✅ Le paramètre `quizMode` a été retiré de la fonction de génération de quiz
- ✅ L'affichage "Mode:" a été supprimé de l'écran de quiz actif

---

### US-4 : Déplacement du Choix de Langue vers les Paramètres

**En tant qu'** utilisateur,  
**je veux** configurer la langue du quiz (Anglais / Arabe) depuis la page Paramètres,  
**afin de** ne pas avoir à la choisir à chaque création de quiz.

**Critères d'acceptation :**
- ✅ Le sélecteur de langue a été retiré de l'écran builder
- ✅ La page **Settings** affiche deux boutons de langue avec drapeaux :
  - 🇬🇧 **English** (sélectionné par défaut)
  - 🇸🇦 **Arabic**
- ✅ Le bouton actif est en orange (`#FF8C00`), l'autre en blanc
- ✅ La langue sélectionnée est un état global utilisé automatiquement lors de la génération de quiz
- ✅ Le choix persiste pendant toute la session utilisateur

---

### US-5 : Réponse IA en JSON Pur avec Catégorisation

**En tant que** système,  
**je veux** que l'IA retourne exclusivement du JSON valide contenant deux objets : `categories` et `questions`,  
**afin de** pouvoir catégoriser automatiquement chaque quiz et suivre les statistiques par catégorie.

**Critères d'acceptation :**
- ✅ Le prompt système précise : "Output ONLY valid JSON with no markdown, no greetings, no extra text"
- ✅ Le format de réponse attendu est :
  ```json
  {
    "categories": ["entertainment"],
    "questions": [
      {
        "question": "...",
        "options": ["...", "...", "...", "..."],
        "correctAnswer": "..."
      }
    ]
  }
  ```
- ✅ Le champ `categories` est un tableau de chaînes identifiant les catégories du quiz
- ✅ Le parsing extrait et stocke les catégories retournées par l'IA
- ✅ Pour les catégories prédéfinies, la catégorie sélectionnée est utilisée ; pour "Custom", la catégorie IA est utilisée

---

### US-6 : Tableau de Bord avec Statistiques Réelles

**En tant qu'** utilisateur,  
**je veux** voir mes statistiques de jeu réelles sur le tableau de bord,  
**afin de** suivre ma progression et mes performances par catégorie.

**Critères d'acceptation :**
- ✅ **3 cartes de résumé** en haut du dashboard :
  - 🎮 **Total Quizzes** — nombre total de quiz joués
  - 🏆 **#1 Finishes** — nombre de quiz avec score parfait (100%)
  - 📈 **Win Rate** — pourcentage de scores parfaits sur le total
- ✅ **Section "Performance by Category"** :
  - Pour chaque catégorie jouée, affichage d'une ligne avec :
    - Emoji et nom de la catégorie (formaté avec majuscule)
    - Nombre de quiz joués et nombre de scores parfaits
    - Taux de réussite (% de scores parfaits) avec barre de progression colorée :
      - 🟢 Vert (`#4CAF50`) si ≥ 70%
      - 🟠 Orange (`#FF8C00`) si ≥ 40%
      - 🔴 Rouge (`#E53935`) si < 40%
  - **Toutes** les catégories apparaissent, y compris celles catégorisées par l'IA comme "other"
- ✅ **Section "Recent Activity"** :
  - Les 5 derniers quiz joués avec catégorie, date, score, et badge 🏆 si parfait
- ✅ Si aucun quiz n'a été joué, un état vide s'affiche : "No games yet — Play a quiz to see your category stats here"

---

### US-7 : Page d'Accueil avec Données Dynamiques

**En tant qu'** utilisateur,  
**je veux** que la page d'accueil affiche mes vrais résultats récents et mes vraies statistiques,  
**afin de** voir ma progression dès l'ouverture de l'application.

**Critères d'acceptation :**
- ✅ La section "Recent Games" affiche les 5 derniers quiz joués avec :
  - Emoji de catégorie, nom de catégorie, score (ex: 8/10), barre de progression colorée
  - Badge 🏆 pour les scores parfaits
- ✅ Si aucun quiz n'a été joué, un message s'affiche : "🎮 Play a quiz to see your history here!"
- ✅ La carte "Your Stats" affiche :
  - Le taux de réussite global (win rate en %)
  - Le nombre total de parties jouées
  - Le nombre de scores parfaits
- ✅ Le lien "View Full History" et "See all" redirigent vers le tab Dashboard
- ✅ Les données fictives codées en dur (Sarah J., Mike Ross, Alex K., 124 games, 840 score) ont été **entièrement supprimées**

---

## 🏗️ Architecture Technique

### Fichiers Modifiés

| Fichier | Modifications |
|---------|---------------|
| `App.tsx` | Refonte complète : nouveau builder "Game Room", système de catégories, prompt IA mis à jour, historique de quiz, suppression du mode quiz et déplacement de la langue |
| `components/HomeScreen.tsx` | Remplacement des données fictives par des données dynamiques depuis `quizHistory`, ajout des états vides |
| `components/DashboardScreen.tsx` | Réécriture complète : statistiques réelles par catégorie, taux de réussite, activité récente |
| `components/SettingsScreen.tsx` | Ajout du sélecteur de langue interactif (Anglais/Arabe) avec drapeaux |

### Types Ajoutés

```typescript
type QuizCategory = 'entertainment' | 'sports' | 'general_knowledge' | 'science' | 'history' | 'custom';

type QuizHistoryEntry = {
  category: string;      // Catégorie du quiz (prédéfinie ou IA)
  score: number;         // Score obtenu
  total: number;         // Nombre total de questions
  date: string;          // Date ISO du quiz
  isFirst: boolean;      // true si score parfait (score === total)
};
```

### Types Supprimés

```typescript
type QuizMode = 'GENERAL' | 'KEY_FACTS' | 'CUSTOM';  // Supprimé
const QUIZ_MODE_LABELS: Record<QuizMode, string>;      // Supprimé
```

---

## 🚀 Lancement

### Web
```sh
npx webpack serve --mode development
```

### Mobile (Android)
```sh
npm run android
```

### Mobile (iOS)
```sh
bundle exec pod install
npm run ios
```

---

## 📦 Technologies

- **React Native** — Framework mobile cross-platform
- **React Native Web** — Support web via Webpack
- **TypeScript** — Typage statique
- **Pollinations AI API** — Génération de questions par IA (modèle `perplexity-fast`)
