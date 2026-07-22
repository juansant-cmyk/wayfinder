import * as Location from "expo-location";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

const UserLocationContext = createContext(null);

function buildLocation(lat, lng, source) {
  return {
    lat,
    lng,
    source,
  };
}

export function UserLocationProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const refreshLocation = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setLocation(null);
        setStatus("denied");
        return null;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nextLocation = buildLocation(
        currentPosition.coords.latitude,
        currentPosition.coords.longitude,
        "gps"
      );
      setLocation(nextLocation);
      setStatus("granted");
      return nextLocation;
    } catch (locationError) {
      const message =
        locationError instanceof Error ? locationError.message : "Unable to read location.";
      setError(message);
      setLocation(null);
      setStatus("denied");
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      location,
      status,
      error,
      refreshLocation,
      isUsingDeviceLocation: location?.source === "gps",
    }),
    [location, status, error, refreshLocation]
  );

  return (
    <UserLocationContext.Provider value={value}>{children}</UserLocationContext.Provider>
  );
}

export function useUserLocation() {
  const context = useContext(UserLocationContext);
  if (!context) {
    throw new Error("useUserLocation must be used within UserLocationProvider");
  }
  return context;
}
