import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { OrderCard } from "@/components/OrderCard";
import { useUser } from "@/context/UserContext";

const C = Colors.light;

type StatusFilter = "all" | "pending" | "accepted" | "rejected" | "cancelled" | "completed";
const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
  { key: "completed", label: "Done" },
];

async function fetchOrders(userId: string, viewAs: "renter" | "owner") {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const param = viewAs === "renter" ? `renterId=${userId}` : `ownerId=${userId}`;
  const res = await fetch(`https://${domain}/api/orders?${param}`);
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewAs, setViewAs] = useState<"renter" | "owner">(
    user?.role === "owner" ? "owner" : "renter"
  );

  const showBothTabs = user?.role === "both";

  const { data: orders = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["orders", user?.id, viewAs],
    queryFn: () => fetchOrders(user!.id, viewAs),
    enabled: !!user?.id,
  });

  const filtered = statusFilter === "all" ? orders : orders.filter((o: any) => o.status === statusFilter);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={styles.headerTitle}>My Orders</Text>
        {showBothTabs && (
          <View style={styles.roleToggle}>
            <TouchableOpacity
              style={[styles.roleBtn, viewAs === "renter" && styles.roleBtnActive]}
              onPress={() => setViewAs("renter")}
            >
              <Text style={[styles.roleBtnText, viewAs === "renter" && styles.roleBtnTextActive]}>As Renter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, viewAs === "owner" && styles.roleBtnActive]}
              onPress={() => setViewAs("owner")}
            >
              <Text style={[styles.roleBtnText, viewAs === "owner" && styles.roleBtnTextActive]}>As Owner</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filtered.length}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.tint} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <FlatList
            horizontal
            data={FILTERS}
            keyExtractor={(f) => f.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, statusFilter === item.key && styles.filterChipActive]}
                onPress={() => setStatusFilter(item.key)}
              >
                <Text style={[styles.filterChipText, statusFilter === item.key && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={C.tint} />
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={C.border} />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptyText}>
                {viewAs === "renter" ? "Book a room to see your orders here" : "Your room bookings will appear here"}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            viewAs={viewAs}
            onPress={() => router.push({ pathname: "/order/[orderId]", params: { orderId: item.id } })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 20, paddingBottom: 4, gap: 14 },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.text },
  roleToggle: {
    flexDirection: "row", backgroundColor: C.borderLight,
    borderRadius: 10, padding: 3,
  },
  roleBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  roleBtnActive: { backgroundColor: C.backgroundCard, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  roleBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  roleBtnTextActive: { color: C.text, fontFamily: "Inter_600SemiBold" },
  filterRow: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.backgroundCard,
  },
  filterChipActive: { backgroundColor: C.tint, borderColor: C.tint },
  filterChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  filterChipTextActive: { color: "#fff" },
  list: { paddingHorizontal: 20 },
  center: { paddingTop: 60, alignItems: "center" },
  empty: { paddingTop: 60, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.text },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center", paddingHorizontal: 20 },
});
