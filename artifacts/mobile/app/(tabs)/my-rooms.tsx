import React from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { RoomCard } from "@/components/RoomCard";
import { useUser } from "@/context/UserContext";

const C = Colors.light;

async function fetchMyRooms(ownerId: string) {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const res = await fetch(`https://${domain}/api/rooms?ownerId=${ownerId}`);
  if (!res.ok) throw new Error("Failed to fetch rooms");
  return res.json();
}

export default function MyRoomsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const qc = useQueryClient();

  const isOwner = user?.role === "owner" || user?.role === "both";

  const { data: rooms = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-rooms", user?.id],
    queryFn: () => fetchMyRooms(user!.id),
    enabled: !!user?.id && isOwner,
  });

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  if (!isOwner) {
    return (
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>
        <View style={[styles.header, { paddingTop: 16 }]}>
          <Text style={styles.headerTitle}>My Rooms</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="business-outline" size={60} color={C.border} />
          <Text style={styles.emptyTitle}>Owner Access Required</Text>
          <Text style={styles.emptyText}>Switch your role to owner to list rooms</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={styles.headerTitle}>My Rooms</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/add-room");
          }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.tint} />
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!rooms.length}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.tint} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="home-outline" size={60} color={C.border} />
              <Text style={styles.emptyTitle}>No rooms listed</Text>
              <Text style={styles.emptyText}>Tap the + button to add your first room</Text>
              <TouchableOpacity
                style={styles.addFirstBtn}
                onPress={() => router.push("/add-room")}
              >
                <Ionicons name="add-circle-outline" size={18} color={C.tint} />
                <Text style={styles.addFirstBtnText}>Add First Room</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <RoomCard
              room={item}
              onPress={() => router.push({ pathname: "/room/[roomId]", params: { roomId: item.id } })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 16,
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.text },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.tint, alignItems: "center", justifyContent: "center",
  },
  list: { paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { paddingTop: 60, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.text },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center" },
  addFirstBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 8, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5, borderColor: C.tint,
  },
  addFirstBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.tint },
});
