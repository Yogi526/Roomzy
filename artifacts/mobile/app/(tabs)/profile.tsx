import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Platform, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useUser } from "@/context/UserContext";

const C = Colors.light;

const ROLE_LABELS = { renter: "Renter", owner: "Room Owner", both: "Owner & Renter" };
const ROLE_ICONS: Record<string, any> = { renter: "search", owner: "home", both: "swap-horizontal" };

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useUser();

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out", style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          logout();
        },
      },
    ]);
  };

  const avatarLetter = user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 100 + bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.headerTitle}>Profile</Text>

      <View style={styles.avatarCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{avatarLetter}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name={ROLE_ICONS[user?.role || "renter"]} size={12} color={C.tint} />
            <Text style={styles.roleText}>{ROLE_LABELS[user?.role || "renter"]}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <SettingRow icon="person-outline" label="Full Name" value={user?.name} />
          <View style={styles.divider} />
          <SettingRow icon="call-outline" label="Phone" value={user?.phone} />
          <View style={styles.divider} />
          <SettingRow icon="shield-checkmark-outline" label="Role" value={ROLE_LABELS[user?.role || "renter"]} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Info</Text>
        <View style={styles.card}>
          <SettingRow icon="information-circle-outline" label="Version" value="1.0.0" />
          <View style={styles.divider} />
          <SettingRow icon="star-outline" label="Rate StayBook" />
          <View style={styles.divider} />
          <SettingRow icon="help-circle-outline" label="Help & Support" />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Roomzy · Connect. Book. Stay.</Text>
    </ScrollView>
  );
}

function SettingRow({ icon, label, value }: { icon: any; label: string; value?: string }) {
  return (
    <View style={styles.settingRow}>
      <Ionicons name={icon} size={20} color={C.textSecondary} />
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color={C.border} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20, gap: 20 },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.text },
  avatarCard: {
    flexDirection: "row", alignItems: "center", gap: 16,
    backgroundColor: C.backgroundCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: `${C.tint}20`, alignItems: "center", justifyContent: "center",
  },
  avatarLetter: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.tint },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text },
  userPhone: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  roleBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: `${C.tint}10`, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, alignSelf: "flex-start", marginTop: 4,
  },
  roleText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.tint },
  section: { gap: 10 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.8 },
  card: { backgroundColor: C.backgroundCard, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  settingLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: C.text },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  settingValue: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  divider: { height: 1, backgroundColor: C.borderLight, marginLeft: 46 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FEE2E2", borderRadius: 14, padding: 16,
    justifyContent: "center", borderWidth: 1, borderColor: "#FCA5A5",
  },
  logoutText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#EF4444" },
  footer: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.border, textAlign: "center" },
});
