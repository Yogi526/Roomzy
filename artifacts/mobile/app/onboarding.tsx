import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useUser, UserRole } from "@/context/UserContext";

const C = Colors.light;

type Step = "welcome" | "role" | "details";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setUser } = useUser();
  const [step, setStep] = useState<Step>("welcome");
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === "welcome") setStep("role");
    else if (step === "role" && role) setStep("details");
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !role) {
      Alert.alert("Missing Info", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const res = await fetch(`https://${domain}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), role }),
      });
      const user = await res.json();
      if (!res.ok) throw new Error(user.message || "Failed to create user");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await setUser(user);
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {step === "welcome" && (
          <View style={styles.section}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="home-city" size={56} color={C.tint} />
            </View>
            <Text style={styles.appName}>StayBook</Text>
            <Text style={styles.tagline}>Book rooms for hours or days.{"\n"}Connect with owners instantly.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue}>
              <Text style={styles.primaryBtnText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {step === "role" && (
          <View style={styles.section}>
            <Text style={styles.stepTitle}>I want to...</Text>
            <Text style={styles.stepSubtitle}>Choose how you'll use StayBook</Text>
            <View style={styles.roleCards}>
              <TouchableOpacity
                style={[styles.roleCard, role === "renter" && styles.roleCardActive]}
                onPress={() => { setRole("renter"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Ionicons name="search" size={32} color={role === "renter" ? "#fff" : C.tint} />
                <Text style={[styles.roleTitle, role === "renter" && styles.roleTitleActive]}>Find Rooms</Text>
                <Text style={[styles.roleDesc, role === "renter" && styles.roleDescActive]}>Browse and book rooms for any duration</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleCard, role === "owner" && styles.roleCardActive]}
                onPress={() => { setRole("owner"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <MaterialCommunityIcons name="home-plus" size={32} color={role === "owner" ? "#fff" : C.tint} />
                <Text style={[styles.roleTitle, role === "owner" && styles.roleTitleActive]}>List Rooms</Text>
                <Text style={[styles.roleDesc, role === "owner" && styles.roleDescActive]}>List your space and receive bookings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleCard, styles.roleCardBoth, role === "both" && styles.roleCardActive]}
                onPress={() => { setRole("both"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Ionicons name="swap-horizontal" size={24} color={role === "both" ? "#fff" : C.tint} />
                <Text style={[styles.roleTitle, role === "both" && styles.roleTitleActive]}>Both</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, !role && styles.primaryBtnDisabled]}
              onPress={handleContinue}
              disabled={!role}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {step === "details" && (
          <View style={styles.section}>
            <Text style={styles.stepTitle}>Your Details</Text>
            <Text style={styles.stepSubtitle}>We'll use this to connect you with {role === "owner" ? "renters" : "room owners"}</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={C.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={C.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color={C.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+92 300 1234567"
                  placeholderTextColor={C.textSecondary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={styles.primaryBtnText}>Start Exploring</Text>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.background },
  container: { flexGrow: 1, padding: 24, justifyContent: "center" },
  section: { gap: 20 },
  logoCircle: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: `${C.tint}15`,
    alignItems: "center", justifyContent: "center",
    alignSelf: "center",
  },
  appName: {
    fontSize: 36, fontFamily: "Inter_700Bold",
    color: C.text, textAlign: "center",
  },
  tagline: {
    fontSize: 17, fontFamily: "Inter_400Regular",
    color: C.textSecondary, textAlign: "center", lineHeight: 26,
  },
  stepTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.text },
  stepSubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 22 },
  roleCards: { gap: 12 },
  roleCard: {
    borderRadius: 16, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.backgroundCard, padding: 20, gap: 6,
  },
  roleCardBoth: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  roleCardActive: { backgroundColor: C.tint, borderColor: C.tint },
  roleTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.text },
  roleTitleActive: { color: "#fff" },
  roleDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  roleDescActive: { color: "rgba(255,255,255,0.8)" },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.text },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.backgroundCard, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1, paddingVertical: 14, fontSize: 16,
    fontFamily: "Inter_400Regular", color: C.text,
  },
  primaryBtn: {
    backgroundColor: C.tint, borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 8,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
