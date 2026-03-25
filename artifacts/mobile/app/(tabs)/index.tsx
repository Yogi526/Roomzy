import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { RoomCard } from "@/components/RoomCard";
import { useUser } from "@/context/UserContext";

const C = Colors.light;

const CITIES = ["All", "Mumbai", "Delhi", "Bangalore", "Lahore", "Karachi", "Islamabad"];
const TYPES = ["All", "private", "shared", "studio", "meeting"];
const TYPE_LABELS: Record<string, string> = {
  All: "All Types", private: "Private", shared: "Shared", studio: "Studio", meeting: "Meeting",
};

async function fetchRooms(city?: string) {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const url = city && city !== "All"
    ? `https://${domain}/api/rooms?city=${encodeURIComponent(city)}`
    : `https://${domain}/api/rooms`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch rooms");
  return res.json();
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedType, setSelectedType] = useState("All");

  const { data: rooms = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["rooms", selectedCity],
    queryFn: () => fetchRooms(selectedCity),
  });

  const filtered = rooms.filter((r: any) => {
    const matchSearch = !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase()) ||
      r.address.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedType === "All" || r.roomType === selectedType;
    return matchSearch && matchType;
  });

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(" ")[0]} 👋</Text>
          <Text style={styles.headerTitle}>Find your perfect space</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={C.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rooms, cities..."
            placeholderTextColor={C.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={C.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {CITIES.map(city => (
          <TouchableOpacity
            key={city}
            style={[styles.filterChip, selectedCity === city && styles.filterChipActive]}
            onPress={() => setSelectedCity(city)}
          >
            <Text style={[styles.filterChipText, selectedCity === city && styles.filterChipTextActive]}>{city}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {TYPES.map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.filterChip, styles.filterChipSmall, selectedType === type && styles.filterChipActive]}
            onPress={() => setSelectedType(type)}
          >
            <Text style={[styles.filterChipText, styles.filterChipTextSmall, selectedType === type && styles.filterChipTextActive]}>{TYPE_LABELS[type]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.tint} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!filtered.length}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.tint} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="home-outline" size={48} color={C.border} />
              <Text style={styles.emptyTitle}>No rooms found</Text>
              <Text style={styles.emptyText}>
                {search ? "Try a different search" : "No rooms available in this area yet"}
              </Text>
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
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.text, marginTop: 2 },
  searchRow: { paddingHorizontal: 20, paddingBottom: 12 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.backgroundCard, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: C.text },
  filterScroll: { marginBottom: 4 },
  filterContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.backgroundCard,
  },
  filterChipSmall: { paddingVertical: 6 },
  filterChipActive: { backgroundColor: C.tint, borderColor: C.tint },
  filterChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  filterChipTextSmall: { fontSize: 12 },
  filterChipTextActive: { color: "#fff" },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { paddingTop: 60, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.text },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center" },
});
