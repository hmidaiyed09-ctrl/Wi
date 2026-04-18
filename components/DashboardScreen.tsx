import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type QuizHistoryEntry = {
  category: string;
  score: number;
  total: number;
  date: string;
  isFirst: boolean;
};

type Props = {
  quizHistory: QuizHistoryEntry[];
};

const CATEGORY_EMOJI_MAP: Record<string, string> = {
  entertainment: '🎬',
  sports: '⚽',
  general_knowledge: '🧠',
  science: '🔬',
  history: '📜',
  custom: '✏️',
};

function getEmoji(category: string): string {
  return CATEGORY_EMOJI_MAP[category] || '📝';
}

function formatCategory(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DashboardScreen({ quizHistory }: Props) {
  const totalQuizzes = quizHistory.length;
  const totalFirstPlace = quizHistory.filter((e) => e.isFirst).length;
  const overallWinRate = totalQuizzes > 0 ? Math.round((totalFirstPlace / totalQuizzes) * 100) : 0;

  // Per-category stats
  const categoryMap = new Map<string, { total: number; firsts: number }>();
  for (const entry of quizHistory) {
    const existing = categoryMap.get(entry.category) || { total: 0, firsts: 0 };
    existing.total += 1;
    if (entry.isFirst) existing.firsts += 1;
    categoryMap.set(entry.category, existing);
  }

  const categories = Array.from(categoryMap.entries()).map(([cat, stats]) => ({
    name: cat,
    emoji: getEmoji(cat),
    label: formatCategory(cat),
    quizzes: stats.total,
    winRate: Math.round((stats.firsts / stats.total) * 100),
    firsts: stats.firsts,
  }));

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Dashboard</Text>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryEmoji}>🎮</Text>
            <Text style={styles.summaryValue}>{totalQuizzes}</Text>
            <Text style={styles.summaryLabel}>Total Quizzes</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryEmoji}>🏆</Text>
            <Text style={styles.summaryValue}>{totalFirstPlace}</Text>
            <Text style={styles.summaryLabel}>#1 Finishes</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryEmoji}>📈</Text>
            <Text style={styles.summaryValue}>{overallWinRate}%</Text>
            <Text style={styles.summaryLabel}>Win Rate</Text>
          </View>
        </View>

        {/* Per-category breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Performance by Category</Text>

          {categories.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No games yet</Text>
              <Text style={styles.emptySubtext}>
                Play a quiz to see your category stats here
              </Text>
            </View>
          ) : (
            categories.map((cat) => (
              <View key={cat.name} style={styles.catRow}>
                <View style={styles.catInfo}>
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <View style={styles.catDetails}>
                    <Text style={styles.catName}>{cat.label}</Text>
                    <Text style={styles.catMeta}>
                      {cat.quizzes} quiz{cat.quizzes !== 1 ? 'zes' : ''} · {cat.firsts} perfect
                    </Text>
                  </View>
                </View>
                <View style={styles.catRight}>
                  <Text style={[
                    styles.catWinRate,
                    cat.winRate >= 70 ? styles.catWinHigh :
                    cat.winRate >= 40 ? styles.catWinMid :
                    styles.catWinLow,
                  ]}>
                    {cat.winRate}%
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${cat.winRate}%`,
                          backgroundColor:
                            cat.winRate >= 70 ? '#4CAF50' :
                            cat.winRate >= 40 ? '#FF8C00' :
                            '#E53935',
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recent Activity */}
        {quizHistory.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {quizHistory.slice(-5).reverse().map((entry, i) => (
              <View key={i} style={styles.activityRow}>
                <Text style={styles.activityEmoji}>{getEmoji(entry.category)}</Text>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityCat}>{formatCategory(entry.category)}</Text>
                  <Text style={styles.activityDate}>
                    {new Date(entry.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.activityScoreWrap}>
                  <Text style={[
                    styles.activityScore,
                    entry.isFirst && styles.activityScorePerfect,
                  ]}>
                    {entry.score}/{entry.total}
                  </Text>
                  {entry.isFirst && <Text style={styles.perfectBadge}>🏆</Text>}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1a1a1a',
    marginTop: 44,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    paddingVertical: 18,
    alignItems: 'center',
  },
  summaryEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F5A623',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    padding: 20,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 18,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  catInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  catEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  catDetails: {
    flex: 1,
  },
  catName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  catMeta: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  catRight: {
    alignItems: 'flex-end',
    width: 100,
  },
  catWinRate: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  catWinHigh: { color: '#4CAF50' },
  catWinMid: { color: '#FF8C00' },
  catWinLow: { color: '#E53935' },
  barTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  activityEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityCat: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  activityDate: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 2,
  },
  activityScoreWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityScore: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  activityScorePerfect: {
    color: '#4CAF50',
  },
  perfectBadge: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
});
