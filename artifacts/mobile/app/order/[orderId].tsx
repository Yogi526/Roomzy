import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useUser } from "@/context/UserContext";

const C = Colors.light;

const STATUS_CONFIG = {
  pending: { color: C.pending, bg: "#FEF3C7", label: "Pending", icon: "time-outline" as const },
  accepted: { color: C.accepted, bg: "#D1FAE5", label: "Accepted", icon: "checkmark-circle-outline" as const },
  rejected: { color: C.rejected, bg: "#FEE2E2", label: "Rejected", icon: "close-circle-outline" as const },
  cancelled: { color: C.cancelled, bg: "#F3F4F6", label: "Cancelled", icon: "ban-outline" as const },
  completed: { color: C.completed, bg: "#DBEAFE", label: "Completed", icon: "checkmark-done-outline" as const },
};

async function fetchOrder(orderId: string) {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const res = await fetch(`https://${domain}/api/orders/${orderId}`);
  if (!res.ok) throw new Error("Order not found");
  return res.json();
}

async function updateStatus(orderId: string, status: string) {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const res = await fetch(`https://${domain}/api/orders/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return dateStr; }
}

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: !!orderId,
  });

  const isOwner = order?.ownerId === user?.id;
  const isRenter = order?.renterId === user?.id;

  const handleStatusUpdate = async (status: string) => {
    try {
      await updateStatus(orderId, status);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    } catch {
      Alert.alert("Error", "Failed to update order status");
    }
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  if (isLoading || !order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.tint} />
      </View>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={[styles.statusBanner, { backgroundColor: statusCfg.bg }]}>
          <Ionicons name={statusCfg.icon} size={28} color={statusCfg.color} />
          <View>
            <Text style={[styles.statusLabel, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            <Text style={styles.statusSub}>
              {order.status === "pending" && "Waiting for owner response"}
              {order.status === "accepted" && "Your booking is confirmed"}
              {order.status === "rejected" && "Owner declined your request"}
              {order.status === "cancelled" && "Booking was cancelled"}
              {order.status === "completed" && "Booking completed"}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Room</Text>
          <Text style={styles.roomName}>{order.roomTitle}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={C.textSecondary} />
            <Text style={styles.infoText}>{order.roomAddress}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Period</Text>
          <View style={styles.timeBlock}>
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>Check-in</Text>
              <Text style={styles.timeValue}>{formatDate(order.checkIn)}</Text>
            </View>
            <View style={styles.timeSep} />
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>Check-out</Text>
              <Text style={styles.timeValue}>{formatDate(order.checkOut)}</Text>
            </View>
          </View>
          <View style={styles.typeBadge}>
            <Ionicons name={order.bookingType === "hourly" ? "time-outline" : "calendar-outline"} size={14} color={C.tint} />
            <Text style={styles.typeText}>{order.bookingType === "hourly" ? "Hourly Booking" : "Daily Booking"}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>
          <DetailRow icon="people-outline" label="Guests" value={`${order.guests}`} />
          {order.specialRequests && (
            <DetailRow icon="chatbox-outline" label="Special Requests" value={order.specialRequests} />
          )}
        </View>

        {isOwner && order.status === "pending" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Renter</Text>
            <DetailRow icon="person-outline" label="Name" value={order.renterName} />
            <DetailRow icon="call-outline" label="Phone" value={order.renterPhone} />
          </View>
        )}

        <View style={[styles.card, styles.priceCard]}>
          <Text style={styles.cardTitle}>Payment</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total Amount</Text>
            <Text style={styles.priceValue}>₹{order.totalAmount.toLocaleString()}</Text>
          </View>
        </View>

        {isOwner && order.status === "pending" && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => Alert.alert("Reject Booking", "Are you sure?", [
                { text: "Cancel", style: "cancel" },
                { text: "Reject", style: "destructive", onPress: () => handleStatusUpdate("rejected") },
              ])}
            >
              <Ionicons name="close" size={18} color={C.error} />
              <Text style={[styles.actionBtnText, { color: C.error }]}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => handleStatusUpdate("accepted")}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={[styles.actionBtnText, { color: "#fff" }]}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {isOwner && order.status === "accepted" && (
          <TouchableOpacity
            style={[styles.fullBtn, { backgroundColor: C.completed }]}
            onPress={() => handleStatusUpdate("completed")}
          >
            <Ionicons name="checkmark-done" size={18} color="#fff" />
            <Text style={[styles.actionBtnText, { color: "#fff" }]}>Mark as Completed</Text>
          </TouchableOpacity>
        )}

        {isRenter && order.status === "pending" && (
          <TouchableOpacity
            style={[styles.fullBtn, { backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#FCA5A5" }]}
            onPress={() => Alert.alert("Cancel Booking", "Cancel this booking request?", [
              { text: "Keep", style: "cancel" },
              { text: "Cancel Booking", style: "destructive", onPress: () => handleStatusUpdate("cancelled") },
            ])}
          >
            <Ionicons name="close-circle-outline" size={18} color={C.error} />
            <Text style={[styles.actionBtnText, { color: C.error }]}>Cancel Request</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={16} color={C.textSecondary} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.borderLight, alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.text },
  content: { paddingHorizontal: 20, gap: 14, paddingTop: 4 },
  statusBanner: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 16,
  },
  statusLabel: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statusSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: C.backgroundCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border, gap: 12,
  },
  priceCard: { backgroundColor: `${C.tint}08`, borderColor: `${C.tint}30` },
  cardTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  roomName: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  timeBlock: { gap: 10 },
  timeItem: { gap: 4 },
  timeLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  timeValue: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  timeSep: { height: 1, backgroundColor: C.border },
  typeBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: `${C.tint}10`, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, alignSelf: "flex-start",
  },
  typeText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.tint },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, flex: 1 },
  detailValue: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.text, flex: 2, textAlign: "right" },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceLabel: { fontSize: 16, fontFamily: "Inter_400Regular", color: C.text },
  priceValue: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.tint },
  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  rejectBtn: { backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#FCA5A5" },
  acceptBtn: { backgroundColor: C.tint },
  actionBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  fullBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14,
  },
});
