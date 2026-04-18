import React, { useState } from 'react';
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

const API_BASE_URL = 'https://gen.pollinations.ai/v1';
const API_KEY = 'dummy';
const API_MODEL = 'perplexity-fast';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type QuizLanguage = 'ARABIC' | 'ENGLISH';
type QuizMode = 'GENERAL' | 'KEY_FACTS' | 'CUSTOM';
type Tab = 'home' | 'dashboard' | 'settings';
type Screen = 'welcome' | 'login' | 'signup' | 'home' | 'builder' | 'generating' | 'quiz' | 'result';

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
};

type QuizPayload = {
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
  }>;
};

const QUIZ_MODE_LABELS: Record<QuizMode, string> = {
  GENERAL: 'General',
  KEY_FACTS: 'Key Facts',
  CUSTOM: 'Custom',
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [numques, setNumQues] = useState(10);
  const [formula, setFormula] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
  const languages: QuizLanguage[] = ['ARABIC', 'ENGLISH'];
  const quizModes: QuizMode[] = ['GENERAL', 'KEY_FACTS', 'CUSTOM'];
  const [selectedDiff, setDiff] = useState<Difficulty>('EASY');
  const [selectedLanguage, setSelectedLanguage] = useState<QuizLanguage>('ARABIC');
  const [selectedQuizMode, setSelectedQuizMode] = useState<QuizMode>('GENERAL');
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [builderError, setBuilderError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(
    {},
  );
  const [score, setScore] = useState(0);
  const [isReviewMode, setIsReviewMode] = useState(false);

  const resetBuilder = () => {
    setNumQues(10);
    setDiff('EASY');
    setSelectedLanguage('ARABIC');
    setSelectedQuizMode('GENERAL');
    setFormula('');
    setCustomInstructions('');
    setBuilderError('');
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setScore(0);
    setIsReviewMode(false);
  };

  const generateQuizFromFormula = async (
    inputFormula: string,
    inputCustomInstructions: string,
    totalQuestions: number,
    difficulty: Difficulty,
    language: QuizLanguage,
    quizMode: QuizMode,
  ): Promise<QuizQuestion[]> => {
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
      const uniqueOptions = new Set(options.map((option) => normalizeText(option)));

      if (normalizedQuestion.length < 10) {
        return false;
      }

      if (uniqueOptions.size < 4) {
        return false;
      }

      if (
        normalizedCorrectAnswer.length > 2 &&
        normalizedQuestion.includes(normalizedCorrectAnswer)
      ) {
        return false;
      }

      return true;
    };

    const providerBaseUrl = API_BASE_URL;
    const providerModel = API_MODEL;
    const providerApiKey = API_KEY;

    const prompt = [
      `Create ${requestedQuestionCount} multiple-choice quiz questions based on the provided topic or formula.`,
      `Topic or formula: ${inputFormula}`,
      `Custom instructions: ${inputCustomInstructions || 'None'}`,
      `Difficulty: ${difficulty}`,
      `Language: ${language}`,
      `Quiz mode: ${quizMode}`,
      'Rules:',
      '- Return only valid JSON.',
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
      'Mode guidance:',
      '- GENERAL: ask broad, sensible questions about the topic.',
      '- KEY_FACTS: focus on important people, dates, places, causes, effects, and major events.',
      '- CUSTOM: use the custom instructions if provided; otherwise infer the most relevant subtopics from the user topic and generate a balanced quiz with real subject logic.',
      'JSON shape:',
      '{"questions":[{"question":"...","options":["...","...","...","..."],"correctAnswer":"..."}]}',
    ].join('\n');

    const response = await fetch(`${providerBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${providerApiKey}`,
      },
      body: JSON.stringify({
        model: providerModel,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content:
              'You generate high-quality quiz questions from a user topic or formula. Output JSON only with no markdown, respect the requested language, avoid trivial or illogical questions, and never turn broad subjects into vocabulary or translation exercises unless explicitly requested.',
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

    const validQuestions: QuizQuestion[] = [];
    const seenQuestions = new Set<string>();

    for (const item of parsed.questions) {
      const rawQuestion = String(item.question).trim();
      const options = Array.isArray(item.options)
        ? item.options
            .map((option) => String(option).trim())
            .filter((option) => option.length > 0)
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
        !isLogicalQuestion(rawQuestion, shuffledOptions, normalizedCorrectAnswer)
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

    return validQuestions.map((item, index) => ({
      ...item,
      id: `${index + 1}`,
      question: `${index + 1}. ${item.question}`,
    }));
  };

  const handleStartQuiz = async () => {
    if (!formula.trim()) {
      setBuilderError('Please enter a topic or formula first.');
      return;
    }
    setBuilderError('');
    setScreen('generating');

    try {
      const generatedQuiz = await generateQuizFromFormula(
        formula,
        customInstructions,
        numques,
        selectedDiff,
        selectedLanguage,
        selectedQuizMode,
      );
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setScore(0);
      setIsReviewMode(false);
      setQuiz(generatedQuiz);
      setScreen('quiz');
    } catch (error) {
      setScreen('home');
      if (
        error instanceof Error &&
        error.message.startsWith('LOW_QUALITY_QUIZ')
      ) {
        setBuilderError(
          'The generated quiz was low quality. Try again and the app will request a better one.',
        );
      } else {
        setBuilderError(
          'Quiz generation failed. Check your API key/network, then try again.',
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
      return selectedAnswers[item.id] === item.correctAnswer ? count + 1 : count;
    }, 0);

    setScore(totalScore);
    setIsReviewMode(false);
    setScreen('result');
  };

  const handleSignOut = () => {
    setScreen('welcome');
    setActiveTab('home');
    resetBuilder();
    setQuiz([]);
  };

  if (screen === 'login') {
    return (
      <LoginScreen
        onLogin={() => { setScreen('home'); setActiveTab('home'); }}
        onGoToSignUp={() => setScreen('signup')}
      />
    );
  }

  if (screen === 'signup') {
    return (
      <SignUpScreen
        onSignUp={() => { setScreen('home'); setActiveTab('home'); }}
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
          AI is building questions from this topic or formula: {formula}
        </Text>
      </View>
    );
  }

  if (screen === 'quiz') {
    return (
      <ScrollView 
        style={styles.quizContainer} 
        contentContainerStyle={styles.quizContentContainer}
      >
        <Text style={styles.quizTitle}>Your Quiz</Text>
        <Text style={styles.quizMeta}>
          Topic: {formula} | Questions: {numques} | Difficulty: {selectedDiff} | Language: {selectedLanguage} | Mode: {QUIZ_MODE_LABELS[selectedQuizMode]}
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
            <Text style={styles.questionTextLarge}>{currentQuestion.question}</Text>
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
                      setSelectedAnswers((prev) => ({
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
                        !isReviewMode && isSelected && styles.optionLabelSelected,
                        showCorrect && styles.optionLabelCorrect,
                        showWrong && styles.optionLabelWrong,
                      ]}
                    >
                      {String.fromCharCode(65 + index)}
                    </Text>
                    <Text
                      style={[
                        styles.optionText,
                        !isReviewMode && isSelected && styles.optionTextSelected,
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
          <Pressable
            onPress={cancelQuiz}
            style={styles.quizCancelButton}
          >
            <Text style={styles.quizCancelButtonText}>Cancel quiz</Text>
          </Pressable>
        </View>

        <View style={styles.quizActionsRow}>
          <Pressable
            onPress={() =>
              setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))
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
                setCurrentQuestionIndex((prev) => prev + 1);
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
        <Text style={styles.resultSummary}>
          Correct answers: {score}
        </Text>

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
          <Text style={styles.resultButtonSecondaryText}>Create another quiz</Text>
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

  // builder — quiz configuration
  if (screen === 'builder') {
    return (
      <View style={styles.homeContainer}>
        <ScrollView contentContainerStyle={styles.homeContent}>
          <View style={styles.builderHeader}>
            <Pressable onPress={() => setScreen('home')} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </Pressable>
            <Text style={styles.homeTitle}>Create a Quiz</Text>
          </View>

          <Text style={styles.sectionHeader}>Main topic or formula</Text>
          <TextInput
            style={styles.topic_box}
            value={formula}
            onChangeText={(text) => {
              setFormula(text);
              if (builderError) {
                setBuilderError('');
              }
            }}
            placeholder="Ex: world war, algebra, biology, a^2 + b^2 = c^2"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
          <Text style={styles.topicHint}>
            The AI will use this topic or formula to build related questions.
          </Text>

          {selectedQuizMode === 'CUSTOM' ? (
            <>
              <Text style={styles.sectionHeader}>Custom instructions</Text>
              <TextInput
                style={styles.customBox}
                value={customInstructions}
                onChangeText={setCustomInstructions}
                placeholder="Ex: focus on battles, leaders, alliances, and causes."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </>
          ) : null}

          {builderError ? (
            <Text style={styles.errorText}>{builderError}</Text>
          ) : null}

          <Text style={styles.sectionHeader}>Number of questions</Text>
          <View style={styles.rowEven}>
            {[5, 10, 15, 20].map((n) => (
              <Pressable
                key={n}
                onPress={() => setNumQues(n)}
                style={numques === n ? styles.numQuesActive : styles.numQues}
              >
                <Text style={numques === n ? styles.text_ques_Active : styles.text_ques}>{n}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionHeader}>Choose your difficulty</Text>
          <View style={styles.difficultyBox}>
            {difficulties.map((item) => (
              <Pressable
                key={item}
                onPress={() => setDiff(item)}
                style={[styles.diffItem, selectedDiff === item && styles.diffItemActive]}
              >
                <Text style={styles.diffText}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionHeader}>Choose quiz language</Text>
          <View style={styles.languageBox}>
            {languages.map((item) => (
              <Pressable
                key={item}
                onPress={() => setSelectedLanguage(item)}
                style={[
                  styles.languageItem,
                  selectedLanguage === item && styles.languageItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.languageText,
                    selectedLanguage === item && styles.languageTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionHeader}>Choose quiz mode</Text>
          <View style={styles.modeBox}>
            {quizModes.map((item) => (
              <Pressable
                key={item}
                onPress={() => setSelectedQuizMode(item)}
                style={[
                  styles.modeItem,
                  selectedQuizMode === item && styles.modeItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeText,
                    selectedQuizMode === item && styles.modeTextActive,
                  ]}
                >
                  {QUIZ_MODE_LABELS[item]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.submit_Modal,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleStartQuiz}
          >
            <Text style={styles.submitText_Modal}>Start Quiz</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // home — tab-based layout
  if (activeTab === 'dashboard') {
    return <DashboardScreen />;
  }

  if (activeTab === 'settings') {
    return <SettingsScreen onSignOut={handleSignOut} />;
  }

  return (
    <HomeScreen
      onPlayAlone={() => setScreen('builder')}
      onSignOut={handleSignOut}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    backgroundColor: '#FFF5E6',
  },
  homeContent: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  homeTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2B2B2B',
    textAlign: 'center',
    marginBottom: 24,
  },
  builderHeader: {
    marginBottom: 8,
  },
  backButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8C00',
  },
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
  subtitle: { color: 'white', fontSize: 18, textAlign: 'center', opacity: 0.9, marginBottom: 20 },
  topic_box: {
    borderWidth: 1.5,
    borderColor: '#FF8C00',
    borderRadius: 12,
    minHeight: 100,
    paddingHorizontal: 12,
    marginBottom: 8,
    fontSize: 16,
  },
  customBox: {
    borderWidth: 1.5,
    borderColor: '#FF8C00',
    borderRadius: 12,
    minHeight: 100,
    paddingHorizontal: 12,
    paddingTop: 12,
    marginBottom: 8,
    fontSize: 16,
  },
  topicHint: { fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center' },
  errorText: {
    fontSize: 14,
    color: '#B22222',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },

  sectionHeader: {
    textAlign: 'center',
    fontWeight: '700',
    color: 'grey',
    marginBottom: 20,
    fontSize: 20,
    letterSpacing: 2,
  },

  rowEven: { flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 10 },

  numQues: {
    width: 60,
    height: 60,
    backgroundColor: '#FF8C00',
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
  },
  numQuesActive: {
    width: 80,
    height: 80,
    borderRadius: 80,
    backgroundColor: '#90EE90',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
  },
  text_ques: { fontSize: 25, color: 'white', fontWeight: 'bold' },
  text_ques_Active: { fontSize: 30, color: 'white', fontWeight: 'bold' },

  difficultyBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  diffItem: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
  },
  diffItemActive: {
    backgroundColor: '#90EE90',
  },
  diffText: { color: 'white', fontWeight: '600', fontSize: 18 },
  languageBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  languageItem: {
    flex: 1,
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFD3A0',
    backgroundColor: '#FFF6EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageItemActive: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  languageText: {
    color: '#9A5A00',
    fontSize: 16,
    fontWeight: '700',
  },
  languageTextActive: {
    color: 'white',
  },
  modeBox: {
    gap: 10,
    marginBottom: 8,
  },
  modeItem: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFD3A0',
    backgroundColor: '#FFF6EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeItemActive: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  modeText: {
    color: '#9A5A00',
    fontSize: 16,
    fontWeight: '700',
  },
  modeTextActive: {
    color: 'white',
  },
  modeHint: {
    marginBottom: 12,
    textAlign: 'center',
    color: '#7B6957',
    fontSize: 13,
    lineHeight: 18,
  },



  submit_Modal: {
    padding: 15,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    marginTop: 20,
    alignSelf: 'center',
  },
  submitText_Modal: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },

  generatingContainer: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  generatingTitle: {
    marginTop: 16,
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  generatingSubtitle: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
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
    shadowOffset: {width: 0, height: 8},
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
  optionList: {
    gap: 12,
  },
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
  optionBoxSelected: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  optionBoxCorrect: {
    backgroundColor: '#DFF7E2',
    borderColor: '#2E9B4F',
  },
  optionBoxWrong: {
    backgroundColor: '#FCE1E1',
    borderColor: '#D93B3B',
  },
  optionBoxPressed: {
    opacity: 0.85,
  },
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
  optionLabelSelected: {
    backgroundColor: 'white',
    color: '#FF8C00',
  },
  optionLabelCorrect: {
    backgroundColor: '#2E9B4F',
    color: 'white',
  },
  optionLabelWrong: {
    backgroundColor: '#D93B3B',
    color: 'white',
  },
  optionText: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    color: '#43362A',
    fontWeight: '600',
  },
  optionTextSelected: {
    color: 'white',
  },
  optionTextCorrect: {
    color: '#1A6A34',
  },
  optionTextWrong: {
    color: '#9E1E1E',
  },
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
  quizCancelButtonText: {
    color: '#B43A2F',
    fontSize: 16,
    fontWeight: '800',
  },
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
  quizNavButtonDisabled: {
    opacity: 0.45,
  },
  quizNavButtonText: {
    color: '#6B4A1F',
    fontSize: 17,
    fontWeight: '700',
  },
  quizNavButtonPrimary: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
  },
  quizNavButtonPrimaryText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
  },
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
  resultButtonPrimaryText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
  },
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
