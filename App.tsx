import React, { useEffect, useState } from 'react';
import type firebase from 'firebase/compat/app';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignUpScreen';
import HomeScreen from './components/HomeScreen';
import DashboardScreen from './components/DashboardScreen';
import SettingsScreen from './components/SettingsScreen';
import CreateRoomScreen from './components/CreateRoomScreen';
import JoinRoomScreen from './components/JoinRoomScreen';
import {
  getCurrentUserProfile,
  initializeAuth,
  loadQuizHistory,
  onAuthStateChanged,
  savePreferredLanguage,
  saveQuizHistoryEntry,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
  type UserProfile,
} from './services/firebaseAuth';

const API_BASE_URL = 'https://gen.pollinations.ai/v1';
const API_KEY = 'dummy';
const API_MODEL = 'perplexity-fast';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type QuizLanguage = 'ARABIC' | 'ENGLISH';
type QuizCategory =
  | 'entertainment'
  | 'sports'
  | 'general_knowledge'
  | 'science'
  | 'history'
  | 'custom';
type Tab = 'home' | 'dashboard' | 'settings';
type Screen =
  | 'welcome'
  | 'login'
  | 'signup'
  | 'home'
  | 'builder'
  | 'generating'
  | 'quiz'
  | 'result'
  | 'createRoom'
  | 'joinRoom';

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
};

type QuizPayload = {
  categories?: string[];
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
  }>;
};

type QuizHistoryEntry = {
  category: string;
  score: number;
  total: number;
  date: string;
  isFirst: boolean;
};

const CATEGORY_OPTIONS: { key: QuizCategory; label: string; emoji: string }[] =
  [
    { key: 'entertainment', label: 'Entertainment', emoji: '🎬' },
    { key: 'sports', label: 'Sports', emoji: '⚽' },
    { key: 'general_knowledge', label: 'General Knowledge', emoji: '🧠' },
    { key: 'science', label: 'Science', emoji: '🔬' },
    { key: 'history', label: 'History', emoji: '📜' },
    { key: 'custom', label: 'Custom', emoji: '✏️' },
  ];

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [numques, setNumQues] = useState(10);
  const [formula, setFormula] = useState('');
  const difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
  const [selectedDiff, setDiff] = useState<Difficulty>('EASY');
  const [selectedLanguage, setSelectedLanguage] =
    useState<QuizLanguage>('ENGLISH');
  const [selectedCategory, setSelectedCategory] =
    useState<QuizCategory>('general_knowledge');
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [builderError, setBuilderError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [score, setScore] = useState(0);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryEntry[]>([]);
  const [lastQuizCategory, setLastQuizCategory] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [syncError, setSyncError] = useState('');
  const profileName = userProfile?.username ?? 'User';
  const profileEmail = userProfile?.email ?? '';
  const authProviderLabel =
    userProfile?.providerId === 'google.com'
      ? 'Google account'
      : 'Email account';
  const getLocalProfileFromAuthUser = (user: firebase.User): UserProfile => ({
    uid: user.uid,
    username:
      typeof user.displayName === 'string' && user.displayName.trim().length > 0
        ? user.displayName.trim()
        : typeof user.email === 'string' && user.email.includes('@')
        ? user.email.split('@')[0].trim() || 'User'
        : 'User',
    email: user.email ?? '',
    providerId: user.providerData?.[0]?.providerId ?? 'password',
    preferredLanguage: 'ENGLISH',
  });

  useEffect(() => {
    let didUnmount = false;
    let unsubscribe: (() => void) | undefined;

    initializeAuth()
      .catch(() => {
        if (!didUnmount) {
          setSyncError('Session persistence is unavailable in this browser.');
        }
      })
      .finally(() => {
        if (didUnmount) {
          return;
        }

        unsubscribe = onAuthStateChanged(
          async user => {
            if (!user) {
              setUserProfile(null);
              setQuizHistory([]);
              setSelectedLanguage('ENGLISH');
              setScreen('welcome');
              setActiveTab('home');
              setAuthLoading(false);
              return;
            }

            try {
              const profile = await getCurrentUserProfile();
              let history: QuizHistoryEntry[] = [];
              let historyLoadFailed = false;
              try {
                history = await loadQuizHistory(profile.uid);
              } catch {
                historyLoadFailed = true;
                setSyncError(
                  'Signed in, but cloud quiz history is currently unavailable.',
                );
              }
              setUserProfile(profile);
              setSelectedLanguage(profile.preferredLanguage);
              setQuizHistory(history);
              if (!historyLoadFailed) {
                setSyncError('');
              }
              setScreen('home');
              setActiveTab('home');
            } catch {
              const localProfile = getLocalProfileFromAuthUser(user);
              setUserProfile(localProfile);
              setQuizHistory([]);
              setSelectedLanguage(localProfile.preferredLanguage);
              setSyncError(
                'Signed in, but cloud profile sync failed. Using local session data.',
              );
              setScreen('home');
              setActiveTab('home');
            } finally {
              setAuthLoading(false);
            }
          },
          () => {
            setAuthLoading(false);
            setScreen('welcome');
          },
        );
      });

    return () => {
      didUnmount = true;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleLanguageChange = (language: QuizLanguage) => {
    setSelectedLanguage(language);

    if (!userProfile) {
      return;
    }

    savePreferredLanguage(userProfile.uid, language).catch(() => {
      setSyncError('Language was updated locally, but cloud sync failed.');
    });
  };

  const resetBuilder = () => {
    setNumQues(10);
    setDiff('EASY');
    setSelectedCategory('general_knowledge');
    setFormula('');
    setBuilderError('');
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setScore(0);
    setIsReviewMode(false);
  };

  const getCategoryTopic = (cat: QuizCategory): string => {
    const map: Record<QuizCategory, string> = {
      entertainment:
        'Entertainment, movies, music, TV shows, celebrities, pop culture',
      sports: 'Sports, football, basketball, Olympics, athletes, competitions',
      general_knowledge:
        'General knowledge, trivia, world facts, geography, culture',
      science: 'Science, physics, chemistry, biology, space, technology',
      history:
        'History, world wars, ancient civilizations, historical events, leaders',
      custom: '',
    };
    return map[cat];
  };

  const generateQuizFromFormula = async (
    inputFormula: string,
    totalQuestions: number,
    difficulty: Difficulty,
    language: QuizLanguage,
  ): Promise<{ questions: QuizQuestion[]; categories: string[] }> => {
    const requestedQuestionCount = totalQuestions + 4;

    const shuffleOptions = (items: string[]) => {
      const shuffled = [...items];
      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        const currentValue = shuffled[index];
        shuffled[index] = shuffled[randomIndex];
        shuffled[randomIndex] = currentValue;
      }
      return shuffled;
    };

    const normalizeText = (value: string) =>
      value
        .normalize('NFKC')
        .toLocaleLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();

    const isLogicalQuestion = (
      questionText: string,
      options: string[],
      correctAnswer: string,
    ) => {
      const normalizedQuestion = normalizeText(questionText);
      const normalizedCorrectAnswer = normalizeText(correctAnswer);
      const uniqueOptions = new Set(
        options.map(option => normalizeText(option)),
      );
      if (normalizedQuestion.length < 10) return false;
      if (uniqueOptions.size < 4) return false;
      if (
        normalizedCorrectAnswer.length > 2 &&
        normalizedQuestion.includes(normalizedCorrectAnswer)
      )
        return false;
      return true;
    };

    const prompt = [
      `Create ${requestedQuestionCount} multiple-choice quiz questions based on the provided topic.`,
      `Topic: ${inputFormula}`,
      `Difficulty: ${difficulty}`,
      `Language: ${language}`,
      'Rules:',
      '- Return ONLY valid JSON. No greetings, no explanations, no markdown.',
      '- Include a "categories" field: an array of category strings that best describe this quiz (e.g. ["entertainment"], ["sports", "history"]).',
      '- Keep each question clear, factual, and logically written.',
      '- Each question must have exactly 4 answer options.',
      '- Add a correctAnswer field that exactly matches one option string.',
      '- Write all questions and answer options in the requested language.',
      '- Treat broad topics like history, war, science, or math as subject-matter topics, not as vocabulary words.',
      '- Do not generate translation, spelling, word-meaning, or language-learning questions unless the user explicitly asks for language study.',
      '- Never ask self-referential or tautological questions.',
      '- Never put the correct answer text directly inside the question.',
      '- Avoid weak questions like "What is the name of X?" when X is already obvious from the topic.',
      '- Make wrong answers plausible and from the same category as the correct answer.',
      '- Avoid repeated questions and avoid duplicate options.',
      '- Do not include explanations.',
      'JSON shape:',
      '{"categories":["..."],"questions":[{"question":"...","options":["...","...","...","..."],"correctAnswer":"..."}]}',
    ].join('\n');

    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: API_MODEL,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content:
              'You generate high-quality quiz questions. Output ONLY valid JSON with no markdown, no greetings, no extra text. Always include a "categories" array and a "questions" array. Respect the requested language.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`API_HTTP_${response.status}: ${details.slice(0, 200)}`);
    }

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content;

    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('INVALID_PROVIDER_RESPONSE');
    }

    let parsed: QuizPayload;
    try {
      parsed = JSON.parse(content) as QuizPayload;
    } catch {
      throw new Error('INVALID_JSON_FROM_PROVIDER');
    }

    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('NO_QUESTIONS_RETURNED');
    }

    const aiCategories = Array.isArray(parsed.categories)
      ? parsed.categories
      : [];

    const validQuestions: QuizQuestion[] = [];
    const seenQuestions = new Set<string>();

    for (const item of parsed.questions) {
      const rawQuestion = String(item.question).trim();
      const options = Array.isArray(item.options)
        ? item.options
            .map(option => String(option).trim())
            .filter(option => option.length > 0)
            .slice(0, 4)
        : [];

      while (options.length < 4) {
        options.push(`Option ${options.length + 1}`);
      }

      const normalizedCorrectAnswer = options.includes(item.correctAnswer)
        ? item.correctAnswer
        : options[0];
      const shuffledOptions = shuffleOptions(options);
      const questionKey = normalizeText(rawQuestion);

      if (
        seenQuestions.has(questionKey) ||
        !isLogicalQuestion(
          rawQuestion,
          shuffledOptions,
          normalizedCorrectAnswer,
        )
      ) {
        continue;
      }

      seenQuestions.add(questionKey);
      validQuestions.push({
        id: '',
        question: rawQuestion,
        options: shuffledOptions,
        correctAnswer: normalizedCorrectAnswer,
      });

      if (validQuestions.length === totalQuestions) {
        break;
      }
    }

    if (validQuestions.length < totalQuestions) {
      throw new Error('LOW_QUALITY_QUIZ');
    }

    return {
      categories: aiCategories,
      questions: validQuestions.map((item, index) => ({
        ...item,
        id: `${index + 1}`,
        question: `${index + 1}. ${item.question}`,
      })),
    };
  };

  const handleStartQuiz = async () => {
    const topic =
      selectedCategory === 'custom'
        ? formula.trim()
        : getCategoryTopic(selectedCategory);
    if (!topic) {
      setBuilderError('Please enter a topic first.');
      return;
    }
    setBuilderError('');
    setScreen('generating');

    try {
      const result = await generateQuizFromFormula(
        topic,
        numques,
        selectedDiff,
        selectedLanguage,
      );
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setScore(0);
      setIsReviewMode(false);
      setQuiz(result.questions);
      const cat =
        selectedCategory === 'custom'
          ? result.categories.length > 0
            ? result.categories[0]
            : 'custom'
          : selectedCategory;
      setLastQuizCategory(cat);
      setScreen('quiz');
    } catch (error) {
      setScreen('builder');
      if (
        error instanceof Error &&
        error.message.startsWith('LOW_QUALITY_QUIZ')
      ) {
        setBuilderError('The generated quiz was low quality. Try again.');
      } else {
        setBuilderError(
          'Quiz generation failed. Check your network, then try again.',
        );
      }
    }
  };

  const cancelQuiz = () => {
    setScreen('home');
    resetBuilder();
    setQuiz([]);
  };

  const currentQuestion = quiz[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  const finishQuiz = () => {
    const totalScore = quiz.reduce((count, item) => {
      return selectedAnswers[item.id] === item.correctAnswer
        ? count + 1
        : count;
    }, 0);

    setScore(totalScore);
    setIsReviewMode(false);

    const entry: QuizHistoryEntry = {
      category: lastQuizCategory,
      score: totalScore,
      total: quiz.length,
      date: new Date().toISOString(),
      isFirst: totalScore === quiz.length,
    };
    setQuizHistory(prev => [...prev, entry]);
    if (userProfile) {
      saveQuizHistoryEntry(userProfile.uid, entry).catch(() => {
        setSyncError('Your score was saved locally, but cloud sync failed.');
      });
    }

    setScreen('result');
  };

  const handleEmailLogin = async (email: string, password: string) => {
    await signInWithEmail(email, password);
  };

  const handleEmailSignUp = async (
    username: string,
    email: string,
    password: string,
  ) => {
    await signUpWithEmail(username, email, password);
  };

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
  };

  const handleGoogleSignUp = async (username: string) => {
    await signInWithGoogle(username);
  };

  const handleSignOut = () => {
    resetBuilder();
    setQuiz([]);
    signOutUser().catch(() => {
      setSyncError('Sign out failed. Please try again.');
    });
  };

  if (authLoading) {
    return (
      <View style={styles.generatingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.generatingTitle}>Loading your account...</Text>
      </View>
    );
  }

  if (screen === 'createRoom') {
    return (
      <CreateRoomScreen
        onBack={() => setScreen('home')}
        profileName={profileName}
      />
    );
  }

  if (screen === 'joinRoom') {
    return (
      <JoinRoomScreen
        onBack={() => setScreen('home')}
        profileName={profileName}
      />
    );
  }

  if (screen === 'login') {
    return (
      <LoginScreen
        onLogin={handleEmailLogin}
        onGoogleLogin={handleGoogleLogin}
        onGoToSignUp={() => setScreen('signup')}
      />
    );
  }

  if (screen === 'signup') {
    return (
      <SignUpScreen
        onSignUp={handleEmailSignUp}
        onGoogleSignUp={handleGoogleSignUp}
        onGoToLogin={() => setScreen('login')}
      />
    );
  }

  if (screen === 'generating') {
    return (
      <View style={styles.generatingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.generatingTitle}>Generating quiz...</Text>
        <Text style={styles.generatingSubtitle}>
          AI is building your{' '}
          {selectedCategory === 'custom'
            ? formula
            : selectedCategory.replace('_', ' ')}{' '}
          quiz
        </Text>
      </View>
    );
  }

  if (screen === 'quiz') {
    const categoryLabel = lastQuizCategory.replace(/_/g, ' ');
    return (
      <ScrollView
        style={styles.quizContainer}
        contentContainerStyle={styles.quizContentContainer}
      >
        <Text style={styles.quizTitle}>Your Quiz</Text>
        <Text style={styles.quizMeta}>
          Category: {categoryLabel} | Questions: {numques} | Difficulty:{' '}
          {selectedDiff}
        </Text>
        <Text style={styles.quizProgress}>
          {isReviewMode
            ? `Review mode | Score: ${score} / ${quiz.length}`
            : `Answered: ${answeredCount} / ${quiz.length}`}
        </Text>
        <Text style={styles.questionCounter}>
          Question {currentQuestionIndex + 1} / {quiz.length}
        </Text>

        {currentQuestion ? (
          <View style={styles.questionCardLarge}>
            <Text style={styles.questionTextLarge}>
              {currentQuestion.question}
            </Text>
            <View style={styles.optionList}>
              {currentQuestion.options.map((option, index) => {
                const selectedAnswer = selectedAnswers[currentQuestion.id];
                const isSelected = selectedAnswer === option;
                const isCorrect = currentQuestion.correctAnswer === option;
                const showCorrect = isReviewMode && isCorrect;
                const showWrong = isReviewMode && isSelected && !isCorrect;
                return (
                  <Pressable
                    key={`${currentQuestion.id}-${index}`}
                    disabled={isReviewMode}
                    onPress={() =>
                      setSelectedAnswers(prev => ({
                        ...prev,
                        [currentQuestion.id]: option,
                      }))
                    }
                    style={({ pressed }) => [
                      styles.optionBox,
                      !isReviewMode && isSelected && styles.optionBoxSelected,
                      showCorrect && styles.optionBoxCorrect,
                      showWrong && styles.optionBoxWrong,
                      pressed && !isReviewMode && styles.optionBoxPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        !isReviewMode &&
                          isSelected &&
                          styles.optionLabelSelected,
                        showCorrect && styles.optionLabelCorrect,
                        showWrong && styles.optionLabelWrong,
                      ]}
                    >
                      {String.fromCharCode(65 + index)}
                    </Text>
                    <Text
                      style={[
                        styles.optionText,
                        !isReviewMode &&
                          isSelected &&
                          styles.optionTextSelected,
                        showCorrect && styles.optionTextCorrect,
                        showWrong && styles.optionTextWrong,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.quizActionsRow}>
          <Pressable onPress={cancelQuiz} style={styles.quizCancelButton}>
            <Text style={styles.quizCancelButtonText}>Cancel quiz</Text>
          </Pressable>
        </View>

        <View style={styles.quizActionsRow}>
          <Pressable
            onPress={() =>
              setCurrentQuestionIndex(prev => Math.max(prev - 1, 0))
            }
            disabled={currentQuestionIndex === 0}
            style={[
              styles.quizNavButton,
              currentQuestionIndex === 0 && styles.quizNavButtonDisabled,
            ]}
          >
            <Text style={styles.quizNavButtonText}>Previous</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (currentQuestionIndex < quiz.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                return;
              }
              if (isReviewMode) {
                setScreen('result');
                return;
              }
              finishQuiz();
            }}
            style={styles.quizNavButtonPrimary}
          >
            <Text style={styles.quizNavButtonPrimaryText}>
              {currentQuestionIndex < quiz.length - 1
                ? 'Next'
                : isReviewMode
                ? 'Back to result'
                : 'Finish'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  if (screen === 'result') {
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Quiz Result</Text>
        <Text style={styles.resultScore}>
          {score} / {quiz.length}
        </Text>
        <Text style={styles.resultSummary}>
          You answered {answeredCount} out of {quiz.length} questions.
        </Text>
        <Text style={styles.resultSummary}>Correct answers: {score}</Text>

        <Pressable
          style={styles.resultButtonPrimary}
          onPress={() => {
            setCurrentQuestionIndex(0);
            setIsReviewMode(true);
            setScreen('quiz');
          }}
        >
          <Text style={styles.resultButtonPrimaryText}>Review quiz</Text>
        </Pressable>

        <Pressable
          style={styles.resultButtonSecondary}
          onPress={() => {
            setScreen('home');
            resetBuilder();
            setQuiz([]);
          }}
        >
          <Text style={styles.resultButtonSecondaryText}>
            Create another quiz
          </Text>
        </Pressable>
      </View>
    );
  }

  if (screen === 'welcome') {
    return (
      <View style={styles.container}>
        <View style={styles.box}>
          <Text style={styles.up_logo}>Welcome to</Text>
          <Text style={styles.logo}>Wi</Text>
        </View>

        <Text style={styles.subtitle}>
          improve your knowledge while having fun
        </Text>

        <Pressable
          onPress={() => setScreen('login')}
          style={({ pressed }) => [
            styles.submit,
            {
              backgroundColor: pressed ? '#ddd' : 'white',
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
        >
          <Text style={styles.submitText}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  // builder — dark room design
  if (screen === 'builder') {
    return (
      <View style={styles.builderContainer}>
        <View pointerEvents="none" style={styles.builderGlowTop} />
        <View pointerEvents="none" style={styles.builderGlowBottom} />
        <ScrollView contentContainerStyle={styles.builderContent}>
          <Pressable
            onPress={() => setScreen('home')}
            style={styles.builderBack}
          >
            <Text style={styles.builderBackText}>← Back</Text>
          </Pressable>

          <View style={styles.builderHero}>
            <Text style={styles.builderTitle}>Game Room</Text>
            <Text style={styles.builderSubtitle}>
              Set up your quiz challenge
            </Text>
          </View>

          {/* Category Grid */}
          <Text style={styles.builderSection}>Choose Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORY_OPTIONS.map(cat => (
              <Pressable
                key={cat.key}
                onPress={() => {
                  setSelectedCategory(cat.key);
                  if (builderError) setBuilderError('');
                }}
                style={[
                  styles.categoryCard,
                  selectedCategory === cat.key && styles.categoryCardActive,
                ]}
              >
                <View
                  style={[
                    styles.categoryEmojiWrap,
                    selectedCategory === cat.key &&
                      styles.categoryEmojiWrapActive,
                  ]}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                </View>
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === cat.key && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Custom topic input — only for custom */}
          {selectedCategory === 'custom' && (
            <View style={styles.customTopicWrap}>
              <Text style={styles.builderSection}>Your Topic</Text>
              <TextInput
                style={styles.customTopicInput}
                value={formula}
                onChangeText={text => {
                  setFormula(text);
                  if (builderError) setBuilderError('');
                }}
                placeholder="Ex: world war, algebra, biology..."
                placeholderTextColor="#666"
                multiline
              />
            </View>
          )}

          {builderError ? (
            <Text style={styles.builderError}>{builderError}</Text>
          ) : null}

          {/* Number of questions */}
          <Text style={styles.builderSection}>Questions</Text>
          <View style={styles.numRow}>
            {[5, 10, 15, 20].map(n => (
              <Pressable
                key={n}
                onPress={() => setNumQues(n)}
                style={[
                  styles.numCircle,
                  numques === n && styles.numCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.numText,
                    numques === n && styles.numTextActive,
                  ]}
                >
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Difficulty */}
          <Text style={styles.builderSection}>Difficulty</Text>
          <View style={styles.diffRow}>
            {difficulties.map(item => (
              <Pressable
                key={item}
                onPress={() => setDiff(item)}
                style={[
                  styles.diffPill,
                  selectedDiff === item && styles.diffPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.diffPillText,
                    selectedDiff === item && styles.diffPillTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Start button */}
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleStartQuiz}
          >
            <Text style={styles.startButtonText}>Start Quiz</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // home — tab-based layout
  if (activeTab === 'dashboard') {
    return (
      <DashboardScreen
        quizHistory={quizHistory}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    );
  }

  if (activeTab === 'settings') {
    return (
      <SettingsScreen
        onSignOut={handleSignOut}
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    );
  }

  return (
    <HomeScreen
      onPlayAlone={() => setScreen('builder')}
      onCreateRoom={() => setScreen('createRoom')}
      onJoinRoom={() => setScreen('joinRoom')}
      onSignOut={handleSignOut}
      profileName={profileName}
      profileEmail={profileEmail}
      authProviderLabel={authProviderLabel}
      syncError={syncError}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      quizHistory={quizHistory}
    />
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  /* Builder — dark room */
  builderContainer: {
    flex: 1,
    backgroundColor: '#171A2B',
  },
  builderGlowTop: {
    position: 'absolute',
    top: -140,
    left: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,140,0,0.12)',
  },
  builderGlowBottom: {
    position: 'absolute',
    bottom: -180,
    right: -140,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(245,166,35,0.08)',
  },
  builderContent: {
    paddingTop: 44,
    paddingHorizontal: 20,
    paddingBottom: 78,
  },
  builderBack: {
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  builderBackText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF8C00',
    textShadowColor: 'rgba(255,140,0,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  builderHero: {
    alignItems: 'center',
    marginBottom: 26,
  },
  builderTitle: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  builderSubtitle: {
    fontSize: 16,
    color: '#9AA1C0',
    textAlign: 'center',
  },
  builderSection: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C0C4E0',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#232741',
    borderRadius: 20,
    borderWidth: 1.8,
    borderColor: '#3A3F66',
    paddingVertical: 18,
    alignItems: 'center',
    gap: 10,
  },
  categoryCardActive: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  categoryEmojiWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmojiWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  categoryEmoji: {
    fontSize: 26,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8B8FAD',
  },
  categoryLabelActive: {
    color: '#FFFFFF',
  },
  customTopicWrap: {
    marginBottom: 20,
  },
  customTopicInput: {
    backgroundColor: '#232741',
    borderRadius: 14,
    borderWidth: 1.8,
    borderColor: '#3A3F66',
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  builderError: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  numRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 28,
  },
  numCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#232741',
    borderWidth: 1.8,
    borderColor: '#3A3F66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numCircleActive: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  numText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8B8FAD',
  },
  numTextActive: {
    color: '#FFFFFF',
  },
  diffRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  diffPill: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#232741',
    borderWidth: 1.8,
    borderColor: '#3A3F66',
    alignItems: 'center',
  },
  diffPillActive: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  diffPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B8FAD',
  },
  diffPillTextActive: {
    color: '#FFFFFF',
  },
  startButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFC06A',
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  /* Welcome */
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  box: { alignItems: 'center' },
  logo: {
    fontSize: 90,
    color: 'white',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 2, height: 10 },
    textShadowRadius: 10,
    marginBottom: 40,
    elevation: 10,
  },
  up_logo: {
    fontSize: 33,
    color: 'black',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 2, height: 1 },
    textShadowRadius: 10,
    marginBottom: -20,
  },
  submit: {
    width: '80%',
    height: 60,
    backgroundColor: 'white',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 10,
  },
  submitText: { color: '#FF8C00', fontWeight: 'bold', fontSize: 20 },
  subtitle: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 20,
  },

  /* Generating */
  generatingContainer: {
    flex: 1,
    backgroundColor: '#1B1D2A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  generatingTitle: {
    marginTop: 16,
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  generatingSubtitle: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
    color: '#8B8FAD',
  },

  /* Quiz */
  quizContainer: {
    flex: 1,
    backgroundColor: '#FFF5E6',
  },
  quizContentContainer: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  quizTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
  },
  quizMeta: {
    marginTop: 6,
    marginBottom: 8,
    textAlign: 'center',
    color: '#555',
    fontSize: 13,
  },
  quizProgress: {
    marginBottom: 12,
    textAlign: 'center',
    color: '#A05A00',
    fontSize: 15,
    fontWeight: '700',
  },
  questionCounter: {
    marginBottom: 18,
    textAlign: 'center',
    color: '#6B5B4D',
    fontSize: 16,
    fontWeight: '700',
  },
  questionCardLarge: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 18,
    minHeight: 440,
    borderWidth: 1,
    borderColor: '#F0D9B6',
    shadowColor: '#8A5A00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  questionTextLarge: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    color: '#2B2B2B',
    marginBottom: 22,
  },
  optionList: { gap: 12 },
  optionBox: {
    minHeight: 68,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E8D8BE',
    backgroundColor: '#FFF9F0',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionBoxSelected: { backgroundColor: '#FF8C00', borderColor: '#FF8C00' },
  optionBoxCorrect: { backgroundColor: '#DFF7E2', borderColor: '#2E9B4F' },
  optionBoxWrong: { backgroundColor: '#FCE1E1', borderColor: '#D93B3B' },
  optionBoxPressed: { opacity: 0.85 },
  optionLabel: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1E2CB',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#6F4A16',
    fontSize: 16,
    fontWeight: '800',
    overflow: 'hidden',
    marginRight: 12,
    paddingTop: 6,
  },
  optionLabelSelected: { backgroundColor: 'white', color: '#FF8C00' },
  optionLabelCorrect: { backgroundColor: '#2E9B4F', color: 'white' },
  optionLabelWrong: { backgroundColor: '#D93B3B', color: 'white' },
  optionText: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    color: '#43362A',
    fontWeight: '600',
  },
  optionTextSelected: { color: 'white' },
  optionTextCorrect: { color: '#1A6A34' },
  optionTextWrong: { color: '#9E1E1E' },
  quizActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 24,
    gap: 12,
  },
  quizCancelButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E7B7B2',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF2F0',
  },
  quizCancelButtonText: { color: '#B43A2F', fontSize: 16, fontWeight: '800' },
  quizNavButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D6B88D',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF2DE',
  },
  quizNavButtonDisabled: { opacity: 0.45 },
  quizNavButtonText: { color: '#6B4A1F', fontSize: 17, fontWeight: '700' },
  quizNavButtonPrimary: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
  },
  quizNavButtonPrimaryText: { color: 'white', fontSize: 17, fontWeight: '800' },

  /* Result */
  resultContainer: {
    flex: 1,
    backgroundColor: '#FFF5E6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  resultTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#2B2B2B',
    marginBottom: 20,
  },
  resultScore: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FF8C00',
    marginBottom: 16,
  },
  resultSummary: {
    fontSize: 18,
    color: '#5B4A3B',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultButtonPrimary: {
    marginTop: 28,
    minWidth: 220,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  resultButtonPrimaryText: { color: 'white', fontSize: 17, fontWeight: '800' },
  resultButtonSecondary: {
    marginTop: 14,
    minWidth: 220,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#FFF2DE',
    borderWidth: 2,
    borderColor: '#D6B88D',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  resultButtonSecondaryText: {
    color: '#6B4A1F',
    fontSize: 17,
    fontWeight: '800',
  },
});
