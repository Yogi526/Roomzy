import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useUser } from "@/context/UserContext";

const C = Colors.light;

async function fetchRoom(roomId: string) {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const res = await fetch(`https://${domain}/api/rooms/${roomId}`);
  if (!res.ok) throw new Error("Room not found");
  return res.json();
}

function addHours(date: Date, hours: number): Date {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

type BookingType = "hourly" | "daily";

export default function BookingScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const qc = useQueryClient();

  const [bookingType, setBookingType] = useState<BookingType>("hourly");
  const [hours, setHours] = useState(2);
  const [days, setDays] = useState(1);
  const [guests, setGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => fetchRoom(roomId),
    enabled: !!roomId,
  });

  const now = new Date();
  const checkIn = now;
  const checkOut = bookingType === "hourly" ? addHours(now, hours) : addDays(now, days);
  const totalAmount = bookingType === "hourly"
    ? (room?.pricePerHour || 0) * hours
    : (room?.pricePerDay || 0) * days;

  const handleBook = async () => {
    if (!user || !room) return;
    if (guests > room.maxGuests) {
      Alert.alert("Too many guests", `Maximum ${room.maxGuests} guests allowed`);
      return;
    }

    setLoading(true);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const res = await fetch(`https://${domain}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          roomTitle: room.title,
          roomAddress: `${room.address}, ${room.city}`,
          renterId: user.id,
          renterName: user.name,
          renterPhone: user.phone,
          ownerId: room.ownerId,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          bookingType,
          totalAmount,
          guests,
          specialRequests: specialRequests.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to create booking");

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ["orders"] });
      Alert.alert(
        "Booking Sent!",
        "Your booking request has been sent to the room owner. You'll be notified once they respond.",
        [{ text: "View Orders", onPress: () => { router.replace("/(tabs)/orders"); } }]
      );
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to place booking");
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  if (isLoading || !room) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Room</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.roomSummary}>
          <Text style={styles.roomTitle}>{room.title}</Text>
          <Text style={styles.roomLocation}>{room.city}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Type</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, bookingType === "hourly" && styles.typeBtnActive]}
              onPress={() => setBookingType("hourly")}
            >
              <Ionicons name="time-outline" size={18} color={bookingType === "hourly" ? "#fff" : C.textSecondary} />
              <Text style={[styles.typeBtnText, bookingType === "hourly" && styles.typeBtnTextActive]}>Hourly</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, bookingType === "daily" && styles.typeBtnActive]}
              onPress={() => setBookingType("daily")}
            >
              <Ionicons name="calendar-outline" size={18} color={bookingType === "daily" ? "#fff" : C.textSecondary} />
              <Text style={[styles.typeBtnText, bookingType === "daily" && styles.typeBtnTextActive]}>Daily</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{bookingType === "hourly" ? "Duration (Hours)" : "Duration (Days)"}</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (bookingType === "hourly") setHours(Math.max(1, hours - 1));
                else setDays(Math.max(1, days - 1));
              }}
            >
              <Ionicons name="remove" size={20} color={C.tint} />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{bookingType === "hourly" ? hours : days}</Text>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (bookingType === "hourly") setHours(Math.min(24, hours + 1));
                else setDays(Math.min(30, days + 1));
              }}
            >
              <Ionicons name="add" size={20} color={C.tint} />
            </TouchableOpacity>
          </View>
          <View style={styles.timeDisplay}>
            <View style={styles.timeRow}>
              <Ionicons name="enter-outline" size={16} color={C.tint} />
              <Text style={styles.timeLabel}>Check-in:</Text>
              <Text style={styles.timeValue}>{formatDisplay(checkIn)}</Text>
            </View>
            <View style={styles.timeRow}>
              <Ionicons name="exit-outline" size={16} color={C.accent} />
              <Text style={styles.timeLabel}>Check-out:</Text>
              <Text style={styles.timeValue}>{formatDisplay(checkOut)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Number of Guests</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGuests(Math.max(1, guests - 1)); }}
            >
              <Ionicons name="remove" size={20} color={C.tint} />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{guests}</Text>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGuests(Math.min(room.maxGuests, guests + 1)); }}
            >
              <Ionicons name="add" size={20} color={C.tint} />
            </TouchableOpacity>
          </View>
          <Text style={styles.maxNote}>Max {room.maxGuests} guests allowed</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Special Requests (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Any special requirements or notes..."
            placeholderTextColor={C.textSecondary}
            value={specialRequests}
            onChangeText={setSpecialRequests}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Price Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              ₹{bookingType === "hourly" ? room.pricePerHour : room.pricePerDay} × {bookingType === "hourly" ? hours : days} {bookingType === "hourly" ? "hr" : "day"}
            </Text>
            <Text style={styles.summaryValue}>₹{totalAmount.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{totalAmount.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) }]}>
        <View>
          <Text style={styles.totalFooter}>₹{totalAmount.toLocaleString()}</Text>
          <Text style={styles.totalSub}>Total Amount</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, loading && { opacity: 0.6 }]}
          onPress={handleBook}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.confirmBtnText}>Send Request</Text>
              <Ionicons name="send" size={16} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  roomSummary: { gap: 4 },
  roomTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  roomLocation: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  card: {
    backgroundColor: C.backgroundCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border, gap: 12,
  },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.borderLight,
  },
  typeBtnActive: { backgroundColor: C.tint, borderColor: C.tint },
  typeBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.textSecondary },
  typeBtnTextActive: { color: "#fff" },
  counterRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 },
  counterBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: `${C.tint}15`,
    alignItems: "center", justifyContent: "center",
  },
  counterValue: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.text, minWidth: 48, textAlign: "center" },
  timeDisplay: { gap: 8, backgroundColor: C.borderLight, padding: 12, borderRadius: 10 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  timeValue: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.text },
  maxNote: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center" },
  textArea: {
    fontSize: 14, fontFamily: "Inter_400Regular", color: C.text,
    minHeight: 80, textAlignVertical: "top",
    backgroundColor: C.borderLight, borderRadius: 10, padding: 12,
  },
  summaryCard: {
    backgroundColor: `${C.tint}08`, borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: `${C.tint}30`, gap: 10,
  },
  summaryTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  summaryValue: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.text },
  totalRow: { paddingTop: 10, borderTopWidth: 1, borderTopColor: `${C.tint}20` },
  totalLabel: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text },
  totalValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.tint },
  footer: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: C.backgroundCard, paddingHorizontal: 20, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  totalFooter: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.tint },
  totalSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  confirmBtn: {
    backgroundColor: C.tint, paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 8,
  },
  confirmBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
