import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

const C = Colors.light;

interface Room {
  id: string;
  title: string;
  city: string;
  address: string;
  pricePerHour: number;
  pricePerDay: number;
  roomType: string;
  rating?: number | null;
  totalReviews: number;
  maxGuests: number;
  images: string[];
  isAvailable: boolean;
  amenities: string[];
}

interface RoomCardProps {
  room: Room;
  onPress: () => void;
  horizontal?: boolean;
}

const ROOM_TYPE_ICONS: Record<string, string> = {
  private: "home",
  shared: "people",
  studio: "aperture",
  meeting: "business",
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  private: "Private Room",
  shared: "Shared Space",
  studio: "Studio",
  meeting: "Meeting Room",
};

const PLACEHOLDER_COLORS = ["#1A6B5C", "#2A8C78", "#FF6B35", "#3B82F6", "#8B5CF6"];

export function RoomCard({ room, onPress, horizontal }: RoomCardProps) {
  const colorIndex = room.id.charCodeAt(0) % PLACEHOLDER_COLORS.length;
  const placeholderColor = PLACEHOLDER_COLORS[colorIndex];

  return (
    <TouchableOpacity
      style={[styles.card, horizontal && styles.cardHorizontal]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.imageContainer, horizontal && styles.imageContainerHorizontal, { backgroundColor: `${placeholderColor}20` }]}>
        {room.images.length > 0 ? (
          <Image source={{ uri: room.images[0] }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: `${placeholderColor}20` }]}>
            <MaterialCommunityIcons name="home-city" size={40} color={placeholderColor} />
          </View>
        )}
        {!room.isAvailable && (
          <View style={styles.unavailableBadge}>
            <Text style={styles.unavailableText}>Unavailable</Text>
          </View>
        )}
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{ROOM_TYPE_LABELS[room.roomType] || room.roomType}</Text>
        </View>
      </View>
      <View style={[styles.content, horizontal && styles.contentHorizontal]}>
        <Text style={styles.title} numberOfLines={1}>{room.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={C.textSecondary} />
          <Text style={styles.location} numberOfLines={1}>{room.city}</Text>
        </View>
        <View style={styles.footer}>
          <View style={styles.priceBlock}>
            <Text style={styles.price}>₹{room.pricePerHour.toLocaleString()}</Text>
            <Text style={styles.pricePer}>/hr</Text>
          </View>
          {room.rating != null ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.rating}>{room.rating.toFixed(1)}</Text>
            </View>
          ) : (
            <View style={styles.ratingRow}>
              <Ionicons name="star-outline" size={12} color={C.textSecondary} />
              <Text style={styles.ratingNew}>New</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.backgroundCard,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHorizontal: {
    flexDirection: "row",
    width: 280,
  },
  imageContainer: {
    height: 160,
    backgroundColor: C.borderLight,
  },
  imageContainerHorizontal: {
    width: 110,
    height: "auto",
  },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: {
    flex: 1, alignItems: "center", justifyContent: "center",
  },
  unavailableBadge: {
    position: "absolute", top: 8, left: 8,
    backgroundColor: "rgba(239,68,68,0.9)",
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
  },
  unavailableText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff" },
  typeBadge: {
    position: "absolute", bottom: 8, right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#fff" },
  content: { padding: 12, gap: 6 },
  contentHorizontal: { flex: 1, padding: 12, justifyContent: "space-between" },
  title: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  location: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, flex: 1 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  priceBlock: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  price: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.tint },
  pricePer: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  rating: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.text },
  ratingNew: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
});
