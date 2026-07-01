import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";

import ExploreScreen from "./screens/ExploreScreen";
import HomeScreen from "./screens/HomeScreen";
import ItineraryScreen from "./screens/ItineraryScreen";
import ProfileScreen from "./screens/ProfileScreen";
import SafetyScreen from "./screens/SafetyScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: "#000000",
          tabBarInactiveTintColor: "#777777",
          tabBarStyle: {
            height: 75,
            paddingBottom: 10,
            paddingTop: 8,
            backgroundColor: "#F4F4F4",
          },
          tabBarLabelStyle: {
            fontSize: 11,
          },
          tabBarIcon: ({ color, size }) => {
            let iconName;

            if (route.name === "Home") {
              iconName = "home";
            } else if (route.name === "Explore") {
              iconName = "compass";
            } else if (route.name === "Itinerary") {
              iconName = "calendar";
            } else if (route.name === "Safety") {
              iconName = "shield-checkmark";
            } else if (route.name === "Profile") {
              iconName = "person-circle";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Explore" component={ExploreScreen} />
        <Tab.Screen name="Itinerary" component={ItineraryScreen} />
        <Tab.Screen name="Safety" component={SafetyScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}