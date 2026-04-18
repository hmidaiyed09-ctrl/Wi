import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Tab = 'home' | 'dashboard' | 'settings';

type QuizHistoryEntry = {
  category: string;
  score: number;
  total: number;
  date: string;
  isFirst: boolean;
};

type Props = {
  onPlayAlone: () => void;
  onSignOut: () => void;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  quizHistory: QuizHistoryEntry[];
};

const CATEGORY_EMOJI_MAP: Record<string, string> = {
  entertainment: '🎭',
  sports: '⚽',
  general_knowledge: '🧠',
  science: '🔬',
  history: '📜',
  custom: '✏️',
};

export default function HomeScreen({ onPlayAlone, onSignOut, activeTab, onTabChange, quizHistory }: Props) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.logoSmall}>Wi</Text>
          </View>
          <Pressable
            onPress={() => setShowProfileMenu(true)}
            style={styles.profileAvatar}
          >
            <Text style={styles.profileAvatarText}>U</Text>
          </Pressable>
        </View>

        {/* Profile sign-out menu */}
        <Modal visible={showProfileMenu} transparent animationType="fade">
          <Pressable
            style={styles.profileBackdrop}
            onPress={() => setShowProfileMenu(false)}
          >
            <View style={styles.profileMenu}>
              <Text style={styles.profileMenuName}>User</Text>
              <Text style={styles.profileMenuEmail}>user@example.com</Text>
              <View style={styles.profileMenuDivider} />
              <Pressable
                onPress={() => {
                  setShowProfileMenu(false);
                  onSignOut();
                }}
                style={({ pressed }) => [
                  styles.profileMenuSignOut,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={styles.profileMenuSignOutText}>Sign Out</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        <View style={styles.heroSection}>
          <View style={styles.readyRow}>
            <Text style={styles.readyStar}>✨</Text>
            <Text style={styles.readyText}>READY FOR A CHALLENGE?</Text>
          </View>
          <Text style={styles.pageTitle}>Playground</Text>
        </View>

        {/* Cards Row */}
        <View style={styles.cardsRow}>
          {/* Play Alone */}
          <Pressable
            onPress={onPlayAlone}
            style={({ pressed }) => [
              styles.cardPlayAlone,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={styles.cardPlayDecor1} />
            <View style={styles.cardPlayDecor2} />
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconEmoji}>▶</Text>
            </View>
            <Text style={styles.cardPlayTitle}>Play Alone</Text>
            <Text style={styles.cardPlayDesc}>
              Challenge yourself across 50+ topics and climb the rank.
            </Text>
          </Pressable>

          {/* With Friends */}
          <View style={styles.cardFriends}>
            <View style={styles.friendsIcon}>
              <Text style={styles.friendsIconEmoji}>👥</Text>
            </View>
            <Text style={styles.cardFriendsTitle}>With Friends</Text>
            <Text style={styles.cardFriendsDesc}>
              Invite friends or join a room via QR code.
            </Text>
            <View style={styles.qrActions}>
              <View style={styles.qrAction}>
                <Text style={styles.qrEmoji}>◻</Text>
                <Text style={styles.qrText}>Generate QR</Text>
              </View>
              <View style={styles.qrAction}>
                <Text style={styles.qrEmoji}>⊞</Text>
                <Text style={styles.qrText}>Scan QR</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable style={styles.quickAction} onPress={onPlayAlone}>
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionEmoji}>📝</Text>
            </View>
            <Text style={styles.quickActionLabel}>New Topic</Text>
          </Pressable>
          <Pressable style={styles.quickAction} onPress={() => onTabChange('dashboard')}>
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionEmoji}>📊</Text>
            </View>
            <Text style={styles.quickActionLabel}>Dashboard</Text>
          </Pressable>
          <Pressable style={styles.quickAction} onPress={() => onTabChange('settings')}>
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionEmoji}>⚙</Text>
            </View>
            <Text style={styles.quickActionLabel}>Settings</Text>
          </Pressable>
        </View>

        {/* Recent Games */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionClock}>🕐</Text>
            <Text style={styles.sectionTitle}>Recent Games</Text>
          </View>
          <Pressable onPress={() => onTabChange('dashboard')}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        {quizHistory.length === 0 ? (
          <View style={styles.emptyRecent}>
            <Text style={styles.emptyRecentEmoji}>🎮</Text>
            <Text style={styles.emptyRecentText}>Play a quiz to see your history here!</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gamesScroll}
          >
            {quizHistory.slice(-5).reverse().map((entry, i) => {
              const pct = Math.round((entry.score / entry.total) * 100);
              const color = pct >= 80 ? '#4CAF50' : pct >= 50 ? '#FFA726' : '#EF5350';
              const emoji = CATEGORY_EMOJI_MAP[entry.category] || '📝';
              const catLabel = entry.category.replace(/_/g, ' ').toUpperCase();
              return (
                <View key={i} style={styles.gameCard}>
                  <View style={[styles.gameAvatar, { backgroundColor: '#FFF3E0' }]}>
                    <Text style={styles.gameAvatarEmoji}>{emoji}</Text>
                  </View>
                  <Text style={styles.gameSubject}>{catLabel}</Text>
                  <Text style={[styles.gameScore, { color }]}>{entry.score}/{entry.total}</Text>
                  <View style={styles.gameBar}>
                    <View style={[styles.gameBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                  </View>
                  {entry.isFirst && <Text style={styles.perfectMark}>🏆</Text>}
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <View style={styles.statsLeft}>
              <View style={styles.statsIconBox}>
                <Text style={styles.statsIconEmoji}>📊</Text>
              </View>
              <View>
                <Text style={styles.statsLabel}>Your Stats</Text>
                <Text style={styles.statsSubLabel}>OVERALL PROGRESS</Text>
              </View>
            </View>
            <View style={styles.statsRight}>
              <Text style={styles.statsBigNumber}>
                {quizHistory.length > 0 ? Math.round((quizHistory.filter(e => e.isFirst).length / quizHistory.length) * 100) : 0}
                <Text style={styles.statsPercent}>%</Text>
              </Text>
              <Text style={styles.statsChange}>win rate</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>TOTAL GAMES</Text>
              <Text style={styles.statItemValue}>{quizHistory.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>PERFECT SCORES</Text>
              <Text style={styles.statItemValue}>{quizHistory.filter(e => e.isFirst).length}</Text>
            </View>
          </View>

          <Pressable style={styles.viewHistory} onPress={() => onTabChange('dashboard')}>
            <Text style={styles.viewHistoryText}>View Full History ›</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <Pressable
          style={[styles.navItem, activeTab === 'home' && styles.navItemActive]}
          onPress={() => onTabChange('home')}
        >
          {activeTab === 'home' && <View style={styles.navDot} />}
          <Text style={activeTab === 'home' ? styles.navEmojiActive : styles.navEmoji}>🏠</Text>
          <Text style={activeTab === 'home' ? styles.navLabelActive : styles.navLabel}>Home</Text>
        </Pressable>
        <Pressable
          style={[styles.navItem, activeTab === 'dashboard' && styles.navItemActive]}
          onPress={() => onTabChange('dashboard')}
        >
          {activeTab === 'dashboard' && <View style={styles.navDot} />}
          <Text style={activeTab === 'dashboard' ? styles.navEmojiActive : styles.navEmoji}>📊</Text>
          <Text style={activeTab === 'dashboard' ? styles.navLabelActive : styles.navLabel}>Dashboard</Text>
        </Pressable>
        <Pressable
          style={[styles.navItem, activeTab === 'settings' && styles.navItemActive]}
          onPress={() => onTabChange('settings')}
        >
          {activeTab === 'settings' && <View style={styles.navDot} />}
          <Text style={activeTab === 'settings' ? styles.navEmojiActive : styles.navEmoji}>⚙</Text>
          <Text style={activeTab === 'settings' ? styles.navLabelActive : styles.navLabel}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoSmall: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FF8C00',
  },
  profileAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  profileBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: 20,
  },
  profileMenu: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  profileMenuName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  profileMenuEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  profileMenuDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  profileMenuSignOut: {
    paddingVertical: 8,
  },
  profileMenuSignOutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E74C3C',
  },
  heroSection: {
    marginBottom: 20,
  },
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  readyStar: { fontSize: 12 },
  readyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F5A623',
    letterSpacing: 1.5,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  logoBox: {
    marginLeft: 'auto',
    backgroundColor: '#FF8C00',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },

  // Cards Row
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  cardPlayAlone: {
    flex: 1,
    backgroundColor: '#FF8C00',
    borderRadius: 20,
    padding: 18,
    minHeight: 160,
    overflow: 'hidden',
  },
  cardPlayDecor1: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  cardPlayDecor2: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cardIcon: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardIconEmoji: { fontSize: 16, color: '#fff' },
  cardPlayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  cardPlayDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 14,
  },

  cardFriends: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#eee',
    minHeight: 160,
  },
  friendsIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  friendsIconEmoji: { fontSize: 16 },
  cardFriendsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  cardFriendsDesc: {
    fontSize: 10,
    color: '#888',
    lineHeight: 14,
    marginBottom: 10,
  },
  qrActions: { gap: 6 },
  qrAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qrEmoji: { fontSize: 12, color: '#555' },
  qrText: { fontSize: 11, fontWeight: '500', color: '#555' },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 30,
  },
  quickAction: {
    alignItems: 'center',
    gap: 6,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionEmoji: { fontSize: 18 },
  quickActionLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionClock: { fontSize: 16 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F5A623',
  },

  // Recent Games
  gamesScroll: {
    gap: 10,
    paddingBottom: 4,
    marginBottom: 24,
  },
  gameCard: {
    minWidth: 120,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#f0f0f0',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  gameAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gameAvatarEmoji: { fontSize: 20 },
  perfectMark: { fontSize: 14, marginTop: 6 },
  emptyRecent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#f0f0f0',
    padding: 30,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyRecentEmoji: { fontSize: 32, marginBottom: 8 },
  emptyRecentText: { fontSize: 14, fontWeight: '600', color: '#999', textAlign: 'center' },
  gameSubject: {
    fontSize: 9,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  gameScore: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  gameBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
  },
  gameBarFill: {
    height: 4,
    borderRadius: 2,
  },

  // Stats Card
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#f0f0f0',
    marginBottom: 20,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statsIconBox: {
    width: 42,
    height: 42,
    backgroundColor: '#FFF3E0',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsIconEmoji: { fontSize: 20 },
  statsLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statsSubLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#bbb',
    letterSpacing: 0.5,
  },
  statsRight: {
    alignItems: 'flex-end',
  },
  statsBigNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  statsPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#999',
  },
  statsChange: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4CAF50',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderRadius: 14,
    padding: 14,
  },
  statItemLabel: {
    fontSize: 10,
    color: '#bbb',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statItemValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  viewHistory: {
    alignItems: 'center',
    paddingTop: 4,
  },
  viewHistoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F5A623',
  },

  // Bottom Nav
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
    paddingBottom: 24,
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
  },
  navItemActive: {
    position: 'relative',
  },
  navDot: {
    position: 'absolute',
    top: -10,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F5A623',
  },
  navEmoji: { fontSize: 20, opacity: 0.35 },
  navEmojiActive: { fontSize: 20 },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#ccc',
  },
  navLabelActive: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F5A623',
  },
});
