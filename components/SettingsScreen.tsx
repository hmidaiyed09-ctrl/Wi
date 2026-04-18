import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Tab = 'home' | 'dashboard' | 'settings';
type QuizLanguage = 'ARABIC' | 'ENGLISH';

type Props = {
  onSignOut: () => void;
  selectedLanguage: QuizLanguage;
  onLanguageChange: (lang: QuizLanguage) => void;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

export default function SettingsScreen({ onSignOut, selectedLanguage, onLanguageChange, activeTab, onTabChange }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Language Selection */}
        <Text style={styles.sectionLabel}>Quiz Language</Text>
        <View style={styles.langRow}>
          <Pressable
            onPress={() => onLanguageChange('ENGLISH')}
            style={[
              styles.langOption,
              selectedLanguage === 'ENGLISH' && styles.langOptionActive,
            ]}
          >
            <Text style={styles.langEmoji}>🇬🇧</Text>
            <Text style={[
              styles.langText,
              selectedLanguage === 'ENGLISH' && styles.langTextActive,
            ]}>English</Text>
          </Pressable>
          <Pressable
            onPress={() => onLanguageChange('ARABIC')}
            style={[
              styles.langOption,
              selectedLanguage === 'ARABIC' && styles.langOptionActive,
            ]}
          >
            <Text style={styles.langEmoji}>🇸🇦</Text>
            <Text style={[
              styles.langText,
              selectedLanguage === 'ARABIC' && styles.langTextActive,
            ]}>Arabic</Text>
          </Pressable>
        </View>

        {/* Other Settings */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Notifications</Text>
          <Text style={styles.settingValue}>On</Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>About Wi</Text>
          <Text style={styles.settingValue}>Version 1.0.0</Text>
        </View>

        {/* Sign Out */}
        <Pressable
          onPress={onSignOut}
          style={({ pressed }) => [
            styles.signOutButton,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
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
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  langRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  langOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    paddingVertical: 16,
  },
  langOptionActive: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  langEmoji: {
    fontSize: 22,
  },
  langText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  langTextActive: {
    color: '#fff',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f0f0f0',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 10,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  signOutButton: {
    marginTop: 30,
    backgroundColor: '#E74C3C',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
