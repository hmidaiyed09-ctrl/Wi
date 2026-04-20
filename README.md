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

## 📋 Sprint 2 — Correctifs Navigation & Expérience Utilisateur

**Date :** 18 Avril 2026  
**Objectif :** Corriger le bug de navigation qui bloquait l'utilisateur sur les écrans Dashboard et Settings sans possibilité de revenir à l'accueil.

---

### US-8 : Barre de Navigation Persistante sur Tous les Onglets

**En tant qu'** utilisateur,  
**je veux** pouvoir naviguer librement entre les onglets Home, Dashboard et Settings depuis n'importe quel écran,  
**afin de** ne jamais me retrouver bloqué sur un écran sans moyen de revenir en arrière.

**Problème identifié :**  
Lorsque l'utilisateur cliquait sur **Dashboard** ou **Settings**, l'écran correspondant s'affichait mais la barre de navigation du bas disparaissait complètement. En effet, elle n'était rendue que dans `HomeScreen`, alors que `DashboardScreen` et `SettingsScreen` étaient eux montés **directement** dans `App.tsx` sans inclure cette barre.

**Cause racine :**  
Dans `App.tsx`, les conditions `if (activeTab === 'dashboard')` et `if (activeTab === 'settings')` retournaient leurs composants respectifs à la place de `HomeScreen`, ce qui excluait la barre de navigation (définie uniquement dans `HomeScreen`).

**Critères d'acceptation :**
- ✅ La barre de navigation (Home / Dashboard / Settings) est visible sur **tous** les onglets principaux
- ✅ L'onglet actif est mis en surbrillance avec le point orange indicateur
- ✅ Cliquer sur un onglet depuis Dashboard ou Settings navigue correctement vers l'onglet cible
- ✅ Aucune régression sur le comportement des autres écrans (quiz, builder, résultats)

**Fichiers modifiés :**

| Fichier | Modification |
|---------|--------------|
| `App.tsx` | Propagation des props `activeTab` et `onTabChange` vers `DashboardScreen` et `SettingsScreen` |
| `components/DashboardScreen.tsx` | Ajout du type `Tab`, des props `activeTab` / `onTabChange`, et rendu de la barre de navigation identique à celle de `HomeScreen` |
| `components/SettingsScreen.tsx` | Ajout du type `Tab`, des props `activeTab` / `onTabChange`, et rendu de la barre de navigation identique à celle de `HomeScreen` |

**Solution technique :**

```tsx
// Avant (App.tsx) — DashboardScreen sans navigation
if (activeTab === 'dashboard') {
  return <DashboardScreen quizHistory={quizHistory} />;
}

// Après (App.tsx) — DashboardScreen avec navigation complète
if (activeTab === 'dashboard') {
  return (
    <DashboardScreen
      quizHistory={quizHistory}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
}
```

---

## 📋 Sprint 3 — Nettoyage UI & Iconographie Personnalisée

**Date :** 18 Avril 2026  
**Objectif :** Épurer l'interface d'accueil et remplacer les icônes emoji par des icônes de style "peint" professionnelles pour une expérience premium.

---

### US-9 : Nettoyage de la Page d'Accueil

**En tant qu'** utilisateur,  
**je veux** une page d'accueil moins encombrée,  
**afin de** me concentrer sur les actions principales (jouer seul ou avec des amis).

**Critères d'acceptation :**
- ✅ Retrait de la ligne "Quick Actions" (New Topic, Dashboard, Settings) située sous les cartes principales.
- ✅ L'espace libéré améliore la lisibilité des sections "Recent Games" et "Your Stats".

---

### US-10 : Iconographie "Painted Pro" sur Mesure

**En tant qu'** utilisateur,  
**je veux** des icônes de navigation qui ne ressemblent pas à de simples images ou emojis,  
**afin d'** avoir une interface au look professionnel et unique ("painted style").

**Critères d'acceptation :**
- ✅ Suppression de tous les emojis Text dans la barre de navigation du bas.
- ✅ Création d'un composant `TabIcons.tsx` utilisant uniquement des primitives `View` de React Native (sans bibliothèques externes ni images).
- ✅ Design des icônes :
  - **HomeIcon** : Maison stylisée avec toit et porte.
  - **ChartIcon** : Graphique à barres dynamique à 4 colonnes.
  - **GearIcon** : Engrenage dessiné avec anneau central et dents positionnées précisément.
- ✅ Les icônes s'adaptent dynamiquement : **Orange** (`#F5A623`) quand actif, **Gris** (`#C8C8C8`) quand inactif.

**Fichiers modifiés :**

| Fichier | Modification |
|---------|--------------|
| `components/TabIcons.tsx` [NEW] | Implémentation des icônes `HomeIcon`, `ChartIcon` et `GearIcon` en pur code React Native. |
| `components/HomeScreen.tsx` | Suppression du bloc `quickActions` et intégration des nouvelles icônes dans la `bottomNav`. |
| `components/DashboardScreen.tsx` | Intégration des nouvelles icônes dans la `bottomNav`. |
| `components/SettingsScreen.tsx` | Intégration des nouvelles icônes dans la `bottomNav`. |

---

## 📋 Sprint 4 — Friend Play (Firebase Rooms)

**Date :** 20 Avril 2026  
**Objectif :** Mettre en place la base multijoueur "Play with Friends" avec Firebase : création de room, entrée par code, écran d'attente hôte, et scan caméra en placeholder.

---

### US-11 : Accès au mode Friends depuis la Home

**En tant qu'** utilisateur,  
**je veux** cliquer sur "With Friends" depuis la Home pour accéder à un menu dédié,  
**afin de** choisir rapidement entre créer une room et rejoindre une room existante.

**Critères d'acceptation :**
- ✅ La carte "With Friends" de la Home est cliquable
- ✅ L'écran "Play with Friends" propose 2 options : **Create Room** et **Join Room**
- ✅ Le bouton retour depuis ce menu ramène à la Home

---

### US-12 : Création de room "myfriend" avec état d'attente (Host)

**En tant qu'** hôte,  
**je veux** créer une room nommée **myfriend** et voir son code, mon profil, et l'état d'attente des joueurs,  
**afin de** partager la room avec mes amis et préparer la partie.

**Critères d'acceptation :**
- ✅ La room créée utilise Firebase (Firestore) et génère un code à 6 chiffres
- ✅ Le nom de room **myfriend** est affiché en blanc
- ✅ L'hôte voit :
  - code de room
  - profil hôte
  - nombre de joueurs connectés
  - liste des joueurs de la room
- ✅ L'écran contient des options d'attente (placeholder)
- ✅ Le bouton "Start Game" reste désactivé tant qu'il y a moins de 2 joueurs

---

### US-13 : Rejoindre une room par code (+ scan caméra en placeholder)

**En tant qu'** joueur,  
**je veux** rejoindre une room via un code saisi,  
**afin de** entrer dans la partie d'un ami même sans QR.

**Critères d'acceptation :**
- ✅ Un écran **Join Room** permet la saisie d'un code à 6 chiffres
- ✅ En cas de code valide, le joueur rejoint la room Firebase et voit les infos de room/joueurs
- ✅ Les erreurs sont gérées (code invalide, room introuvable)
- ✅ L'option **Scan with Camera** est présente mais non active (coming soon)

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
