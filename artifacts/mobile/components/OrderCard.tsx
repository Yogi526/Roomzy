import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

const C = Colors.light;

interface Order {
  id: string;
  roomTitle: string;
  roomAddress: string;
  renterName: string;
  checkIn: string;
  checkOut: string;
  bookingType: "hourly" | "daily";
  totalAmount: number;
  guests: number;
  status: "pending" | "accepted" | "rejected" | "cancelled" | "completed";
  createdAt: string;
}

interface OrderCardProps {
  order: Order;
  viewAs: "renter" | "owner";
  onPress: () => void;
}

const STATUS_CONFIG = {
  pending: { color: C.pending, bg: "#FEF3C7", label: "Pending", icon: "time-outline" as const },
  accepted: { color: C.accepted, bg: "#D1FAE5", label: "Accepted", icon: "checkmark-circle-outline" as const },
  rejected: { color: C.rejected, bg: "#FEE2E2", label: "Rejected", icon: "close-circle-outline" as const },
  cancelled: { color: C.cancelled, bg: "#F3F4F6", label: "Cancelled", icon: "ban-outline" as const },
  completed: { color: C.completed, bg: "#DBEAFE", label: "Completed", icon: "checkmark-done-outline" as const },
};

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

export function OrderCard({ order, viewAs, onPress }: OrderCardProps) {
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.roomTitle} numberOfLines={1}>{order.roomTitle}</Text>
          {viewAs === "owner" && (
            <Text style={styles.renterName}>{order.renterName}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Ionicons name={statusCfg.icon} size={12} color={statusCfg.color} />
          <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Check-in</Text>
          <Text style={styles.timeValue}>{formatDate(order.checkIn)}</Text>
        </View>
        <View style={styles.timeDivider}>
          <Ionicons name="arrow-forward" size={16} color={C.textSecondary} />
        </View>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Check-out</Text>
          <Text style={styles.timeValue}>{formatDate(order.checkOut)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.guestsRow}>
          <Ionicons name="people-outline" size={14} color={C.textSecondary} />
          <Text style={styles.guests}>{order.guests} guest{order.guests > 1 ? "s" : ""}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.bookingType}>{order.bookingType === "hourly" ? "Hourly" : "Daily"}</Text>
        </View>
        <Text style={styles.amount}>₹{order.totalAmount.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.backgroundCard,
    borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { flex: 1, gap: 2, marginRight: 12 },
  roomTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  renterName: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeBlock: { flex: 1 },
  timeLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 2 },
  timeValue: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.text },
  timeDivider: { alignItems: "center" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  guestsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  guests: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  dot: { fontSize: 13, color: C.textSecondary },
  bookingType: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  amount: { fontSize: 17, fontFamily: "Inter_700Bold", color: C.tint },
});
