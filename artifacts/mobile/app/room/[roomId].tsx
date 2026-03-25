import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useUser } from "@/context/UserContext";

const C = Colors.light;

const AMENITY_ICONS: Record<string, any> = {
  WiFi: "wifi", AC: "snow", Parking: "car", Kitchen: "restaurant",
  TV: "tv", Gym: "barbell", Pool: "water", Laundry: "shirt",
  Security: "shield-checkmark", Breakfast: "cafe",
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  private: "Private Room", shared: "Shared Space", studio: "Studio", meeting: "Meeting Room",
};

const PLACEHOLDER_COLORS = ["#1A6B5C", "#2A8C78", "#FF6B35", "#3B82F6", "#8B5CF6"];

async function fetchRoom(roomId: string) {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const res = await fetch(`https://${domain}/api/rooms/${roomId}`);
  if (!res.ok) throw new Error("Room not found");
  return res.json();
}

export default function RoomDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const qc = useQueryClient();

  const { data: room, isLoading, error } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => fetchRoom(roomId),
    enabled: !!roomId,
  });

  const isOwner = room?.ownerId === user?.id;
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const colorIndex = roomId ? roomId.charCodeAt(0) % PLACEHOLDER_COLORS.length : 0;
  const placeholderColor = PLACEHOLDER_COLORS[colorIndex];

  const handleToggleAvailability = async () => {
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const res = await fetch(`https://${domain}/api/rooms/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !room?.isAvailable }),
      });
      if (!res.ok) throw new Error("Failed to update");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ["room", roomId] });
      qc.invalidateQueries({ queryKey: ["my-rooms"] });
    } catch {
      Alert.alert("Error", "Could not update availability");
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Room", "Are you sure you want to delete this listing?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            const domain = process.env.EXPO_PUBLIC_DOMAIN;
            await fetch(`https://${domain}/api/rooms/${roomId}`, { method: "DELETE" });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            qc.invalidateQueries({ queryKey: ["my-rooms"] });
            qc.invalidateQueries({ queryKey: ["rooms"] });
            router.back();
          } catch {
            Alert.alert("Error", "Could not delete room");
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: topPad }]}>
        <ActivityIndicator size="large" color={C.tint} />
      </View>
    );
  }

  if (error || !room) {
    return (
      <View style={[styles.center, { paddingTop: topPad }]}>
        <Ionicons name="alert-circle-outline" size={48} color={C.error} />
        <Text style={styles.errorText}>Room not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <View style={[styles.imagePlaceholder, { backgroundColor: `${placeholderColor}25` }]}>
          <MaterialCommunityIcons name="home-city" size={80} color={placeholderColor} />
          <View style={[styles.backBtnAbsolute, { top: topPad + 12 }]}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={C.text} />
            </TouchableOpacity>
          </View>
          {isOwner && (
            <View style={[styles.ownerActions, { top: topPad + 12 }]}>
              <TouchableOpacity style={styles.circleBtn} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={18} color={C.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{room.title}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={C.textSecondary} />
                <Text style={styles.location}>{room.address}, {room.city}</Text>
              </View>
            </View>
            <View style={styles.ratingBlock}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.rating}>{room.rating ? room.rating.toFixed(1) : "New"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoGrid}>
            <InfoItem icon="business" label="Type" value={ROOM_TYPE_LABELS[room.roomType] || room.roomType} />
            <InfoItem icon="people-outline" label="Guests" value={`Up to ${room.maxGuests}`} />
            <InfoItem icon="time-outline" label="Per Hour" value={`₹${room.pricePerHour.toLocaleString()}`} />
            <InfoItem icon="calendar-outline" label="Per Day" value={`₹${room.pricePerDay.toLocaleString()}`} />
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{room.description}</Text>

          {room.amenities?.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {room.amenities.map((a: string) => (
                  <View key={a} style={styles.amenityChip}>
                    <Ionicons name={AMENITY_ICONS[a] || "checkmark-circle"} size={16} color={C.tint} />
                    <Text style={styles.amenityText}>{a}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={styles.divider} />
          <View style={styles.ownerRow}>
            <View style={styles.ownerAvatar}>
              <Text style={styles.ownerAvatarLetter}>{room.ownerName?.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.ownerLabel}>Listed by</Text>
              <Text style={styles.ownerName}>{room.ownerName}</Text>
            </View>
          </View>

          {isOwner && (
            <TouchableOpacity
              style={[styles.availToggle, { backgroundColor: room.isAvailable ? "#FEF3C7" : "#D1FAE5" }]}
              onPress={handleToggleAvailability}
            >
              <Ionicons
                name={room.isAvailable ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={room.isAvailable ? C.warning : C.accepted}
              />
              <Text style={[styles.availToggleText, { color: room.isAvailable ? C.warning : C.accepted }]}>
                {room.isAvailable ? "Mark as Unavailable" : "Mark as Available"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {!isOwner && room.isAvailable && user?.role !== "owner" && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) }]}>
          <View>
            <Text style={styles.footerPrice}>₹{room.pricePerHour.toLocaleString()}<Text style={styles.footerPer}>/hr</Text></Text>
            <Text style={styles.footerDay}>₹{room.pricePerDay.toLocaleString()}/day</Text>
          </View>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: "/booking/[roomId]", params: { roomId: room.id } });
            }}
          >
            <Text style={styles.bookBtnText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function InfoItem({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={20} color={C.tint} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, backgroundColor: C.background },
  imagePlaceholder: {
    height: 280, alignItems: "center", justifyContent: "center", position: "relative",
  },
  backBtnAbsolute: { position: "absolute", left: 16 },
  ownerActions: { position: "absolute", right: 16 },
  circleBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  body: { padding: 20, gap: 16 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  titleBlock: { flex: 1, gap: 6, marginRight: 12 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  ratingBlock: { flexDirection: "row", alignItems: "center", gap: 4 },
  rating: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  divider: { height: 1, backgroundColor: C.border },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  infoItem: { width: "45%", gap: 4, padding: 12, backgroundColor: C.borderLight, borderRadius: 12 },
  infoLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary },
  infoValue: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text },
  description: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 22 },
  amenitiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: `${C.tint}10`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  amenityText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.tint },
  ownerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  ownerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: `${C.tint}20`, alignItems: "center", justifyContent: "center",
  },
  ownerAvatarLetter: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.tint },
  ownerLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary },
  ownerName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  availToggle: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 14, borderRadius: 12,
  },
  availToggleText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  footer: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: C.backgroundCard, paddingHorizontal: 20, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: C.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 8,
  },
  footerPrice: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.tint },
  footerPer: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  footerDay: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  bookBtn: {
    backgroundColor: C.tint, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 14,
  },
  bookBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  errorText: { fontSize: 16, fontFamily: "Inter_500Medium", color: C.text },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: C.tint, borderRadius: 10, marginTop: 8 },
  backBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#fff" },
});
