import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const categories = [
  { name: "Homestay", icon: "🏠" },
  { name: "Resort", icon: "🏝️" },
  { name: "Hotel", icon: "🏢" },
  { name: "Apartment", icon: "🏙️" },
  { name: "Villa", icon: "🏘️" },
  { name: "Hostel", icon: "🏨" },
  { name: "Lodge", icon: "🏡" },
  { name: "See more", icon: "•••" },
];

const recommendations = [
  {
    name: "Bali",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600",
  },
  {
    name: "Iguazu Falls",
    image:
      "https://images.unsplash.com/photo-1544989164-31dc3c645987?w=600",
  },
];

const popularDestinations = [
  {
    name: "Switzerland",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600",
  },
  {
    name: "Japan",
    image:
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600",
  },
];

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileCircle}>
          <Text style={styles.profileLetter}>U</Text>
        </View>

        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeText}>Welcome!</Text>
          <Text style={styles.userText}>User</Text>
        </View>

        <Text style={styles.bell}>🔔</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your destination here..."
          placeholderTextColor="#444"
        />
      </View>

      {/* Categories */}
      <View style={styles.categoryGrid}>
        {categories.map((item, index) => (
          <Pressable key={index} style={styles.categoryItem}>
            <View style={styles.categoryIconBox}>
              <Text style={styles.categoryIcon}>{item.icon}</Text>
            </View>
            <Text style={styles.categoryText}>{item.name}</Text>
          </Pressable>
        ))}
      </View>

      {/* Recommendation */}
      <Text style={styles.sectionTitle}>Recommendation</Text>

      <View style={styles.cardRow}>
        {recommendations.map((item, index) => (
          <View key={index} style={styles.destinationCard}>
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardLabel}>
              <Text style={styles.cardText}>{item.name}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Popular Destinations */}
      <Text style={styles.sectionTitle}>Popular destinations</Text>

      <View style={styles.cardRow}>
        {popularDestinations.map((item, index) => (
          <View key={index} style={styles.destinationCard}>
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardLabel}>
              <Text style={styles.cardText}>⭐ {item.name}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    backgroundColor: "#EAFBFF",
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 38,
    flexDirection: "row",
    alignItems: "center",
  },

  profileCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FF9B57",
    alignItems: "center",
    justifyContent: "center",
  },

  profileLetter: {
    fontSize: 22,
    fontWeight: "600",
  },

  welcomeBox: {
    marginLeft: 12,
  },

  welcomeText: {
    fontSize: 22,
    fontWeight: "500",
  },

  userText: {
    fontSize: 20,
    textAlign: "center",
  },

  bell: {
    marginLeft: "auto",
    fontSize: 28,
  },

  searchBar: {
    marginTop: -3,
    marginHorizontal: 38,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#D9D9D9",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  searchIcon: {
    fontSize: 17,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 13,
  },

  categoryGrid: {
    marginTop: 24,
    paddingHorizontal: 38,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  categoryItem: {
    width: "23%",
    alignItems: "center",
    marginBottom: 18,
  },

  categoryIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F1EEE8",
    alignItems: "center",
    justifyContent: "center",
  },

  categoryIcon: {
    fontSize: 24,
  },

  categoryText: {
    marginTop: 6,
    fontSize: 12,
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 23,
    fontWeight: "500",
    marginLeft: 40,
    marginTop: 24,
    marginBottom: 14,
  },

  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 38,
  },

  destinationCard: {
    width: "48%",
    height: 104,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#DDD",
  },

  cardImage: {
    width: "100%",
    height: "100%",
  },

  cardLabel: {
    position: "absolute",
    bottom: 5,
    left: 8,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },

  cardText: {
    fontSize: 12,
  },

  bottomSpace: {
    height: 30,
  },
});