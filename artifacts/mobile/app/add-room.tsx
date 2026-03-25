import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform, Switch,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useUser } from "@/context/UserContext";

const C = Colors.light;

const ROOM_TYPES = [
  { key: "private", label: "Private Room", icon: "home" },
  { key: "shared", label: "Shared Space", icon: "people" },
  { key: "studio", label: "Studio", icon: "aperture" },
  { key: "meeting", label: "Meeting Room", icon: "business" },
] as const;

const AMENITIES_LIST = [
  "WiFi", "AC", "Parking", "Kitchen", "TV",
  "Gym", "Pool", "Laundry", "Security", "Breakfast",
];

export default function AddRoomScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [roomType, setRoomType] = useState<"private" | "shared" | "studio" | "meeting">("private");
  const [maxGuests, setMaxGuests] = useState(2);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleAmenity = (a: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAmenities(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !city.trim() || !address.trim() || !pricePerHour || !pricePerDay) {
      Alert.alert("Missing Info", "Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const res = await fetch(`https://${domain}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: user!.id,
          ownerName: user!.name,
          title: title.trim(),
          description: description.trim() || "A great space to rent.",
          city: city.trim(),
          address: address.trim(),
          pricePerHour: parseFloat(pricePerHour),
          pricePerDay: parseFloat(pricePerDay),
          roomType,
          amenities: selectedAmenities,
          maxGuests,
          images: [],
        }),
      });

      if (!res.ok) throw new Error("Failed to create room");

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ["my-rooms"] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
      Alert.alert("Room Listed!", "Your room is now live and visible to renters.", [
        { text: "Done", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to list room");
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>List a Room</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basic Info</Text>
          <Field label="Room Title *" icon="text-outline">
            <TextInput style={styles.input} placeholder="e.g., Cozy Private Room in Lahore" placeholderTextColor={C.textSecondary} value={title} onChangeText={setTitle} />
          </Field>
          <Field label="Description" icon="document-text-outline">
            <TextInput style={[styles.input, styles.textArea]} placeholder="Describe your space..." placeholderTextColor={C.textSecondary} value={description} onChangeText={setDescription} multiline numberOfLines={3} textAlignVertical="top" />
          </Field>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Location *</Text>
          <Field label="City" icon="business-outline">
            <TextInput style={styles.input} placeholder="Lahore, Karachi, Mumbai..." placeholderTextColor={C.textSecondary} value={city} onChangeText={setCity} />
          </Field>
          <Field label="Address" icon="location-outline">
            <TextInput style={styles.input} placeholder="Street address" placeholderTextColor={C.textSecondary} value={address} onChangeText={setAddress} />
          </Field>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pricing *</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceField}>
              <Text style={styles.fieldLabel}>Per Hour (₹)</Text>
              <View style={styles.fieldWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="500"
                  placeholderTextColor={C.textSecondary}
                  value={pricePerHour}
                  onChangeText={setPricePerHour}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.priceField}>
              <Text style={styles.fieldLabel}>Per Day (₹)</Text>
              <View style={styles.fieldWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="2500"
                  placeholderTextColor={C.textSecondary}
                  value={pricePerDay}
                  onChangeText={setPricePerDay}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Room Type</Text>
          <View style={styles.typeGrid}>
            {ROOM_TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeBtn, roomType === t.key && styles.typeBtnActive]}
                onPress={() => { setRoomType(t.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Ionicons name={t.icon as any} size={20} color={roomType === t.key ? "#fff" : C.textSecondary} />
                <Text style={[styles.typeBtnLabel, roomType === t.key && styles.typeBtnLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Max Guests</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity style={styles.counterBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMaxGuests(Math.max(1, maxGuests - 1)); }}>
              <Ionicons name="remove" size={20} color={C.tint} />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{maxGuests}</Text>
            <TouchableOpacity style={styles.counterBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMaxGuests(Math.min(20, maxGuests + 1)); }}>
              <Ionicons name="add" size={20} color={C.tint} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {AMENITIES_LIST.map(a => (
              <TouchableOpacity
                key={a}
                style={[styles.amenityChip, selectedAmenities.includes(a) && styles.amenityChipActive]}
                onPress={() => toggleAmenity(a)}
              >
                <Text style={[styles.amenityText, selectedAmenities.includes(a) && styles.amenityTextActive]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) }]}>
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <MaterialCommunityIcons name="home-plus" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>List My Room</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Field({ label, icon, children }: { label: string; icon: any; children: React.ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldWrapper}>
        <Ionicons name={icon} size={18} color={C.textSecondary} style={styles.fieldIcon} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.borderLight, alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.text },
  content: { paddingHorizontal: 20, gap: 16, paddingTop: 8 },
  card: {
    backgroundColor: C.backgroundCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border, gap: 14,
  },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  fieldWrapper: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.borderLight, borderRadius: 10, paddingHorizontal: 12,
  },
  fieldIcon: { flexShrink: 0 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", color: C.text },
  textArea: { minHeight: 72, textAlignVertical: "top" },
  priceRow: { flexDirection: "row", gap: 12 },
  priceField: { flex: 1, gap: 6 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.borderLight,
  },
  typeBtnActive: { backgroundColor: C.tint, borderColor: C.tint },
  typeBtnLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  typeBtnLabelActive: { color: "#fff" },
  counterRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 },
  counterBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${C.tint}15`, alignItems: "center", justifyContent: "center" },
  counterValue: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.text, minWidth: 48, textAlign: "center" },
  amenitiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.borderLight,
  },
  amenityChipActive: { backgroundColor: C.tint, borderColor: C.tint },
  amenityText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  amenityTextActive: { color: "#fff" },
  footer: {
    paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: C.backgroundCard,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  submitBtn: {
    backgroundColor: C.tint, borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  submitBtnText: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
