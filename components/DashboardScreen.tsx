import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const STATS = [
  { label: 'Total Quizzes', value: '0' },
  { label: 'Average Score', value: '0%' },
  { label: 'Best Score', value: '0%' },
];

const DIFFICULTIES = [
  { label: 'Easy', score: 0, color: '#4CAF50' },
  { label: 'Medium', score: 0, color: '#FF8C00' },
  { label: 'Hard', score: 0, color: '#E53935' },
];

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.header}>Dashboard</Text>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Performance by Difficulty */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Performance by Difficulty</Text>

          {DIFFICULTIES.map((diff) => (
            <View key={diff.label} style={styles.diffRow}>
              <Text style={styles.diffLabel}>{diff.label}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${diff.score}%`, backgroundColor: diff.color },
                  ]}
                />
              </View>
              <Text style={styles.diffScore}>{diff.score}</Text>
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No games yet</Text>
            <Text style={styles.emptySubtext}>
              Your recent quiz results will appear here
            </Text>
          </View>
        </View>
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    paddingVertical: 18,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F5A623',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
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
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  diffLabel: {
    width: 60,
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  diffScore: {
    width: 28,
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
    textAlign: 'right',
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
