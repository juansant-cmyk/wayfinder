import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { suggestGeocodeQuery } from "../location/geo";

const INVALID_MESSAGE = "Invalid destination entered";

/**
 * Google-style destination typeahead: top 5 city/country hits.
 * Parent should require a selected suggestion (or matching label) before save.
 */
export default function DestinationSuggestField({
  label = "Destination",
  value,
  onChangeText,
  onSelectSuggestion,
  selectedLabel = null,
  placeholder = "City, Country",
  disabled = false,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const requestIdRef = useRef(0);
  const blurTimeoutRef = useRef(null);

  useEffect(() => {
    const trimmed = String(value || "").trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setInvalid(false);
      return undefined;
    }

    // Already confirmed a pick that matches the field — hide list.
    if (selectedLabel && selectedLabel.trim().toLowerCase() === trimmed.toLowerCase()) {
      setSuggestions([]);
      setLoading(false);
      setInvalid(false);
      return undefined;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await suggestGeocodeQuery(trimmed, 5);
        if (requestId !== requestIdRef.current) {
          return;
        }
        setSuggestions(results);
        setInvalid(results.length === 0);
        setShowList(true);
      } catch {
        if (requestId !== requestIdRef.current) {
          return;
        }
        setSuggestions([]);
        setInvalid(true);
        setShowList(true);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [value, selectedLabel]);

  useEffect(
    () => () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    },
    []
  );

  const handleChange = (next) => {
    onChangeText?.(next);
    onSelectSuggestion?.(null);
    setInvalid(false);
    setShowList(true);
  };

  const handleSelect = (suggestion) => {
    onChangeText?.(suggestion.label);
    onSelectSuggestion?.(suggestion);
    setSuggestions([]);
    setShowList(false);
    setInvalid(false);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setShowList(false);
      const trimmed = String(value || "").trim();
      if (!trimmed) {
        setInvalid(false);
        return;
      }
      if (selectedLabel && selectedLabel.trim().toLowerCase() === trimmed.toLowerCase()) {
        setInvalid(false);
        return;
      }
      if (!loading && suggestions.length === 0 && trimmed.length >= 2) {
        setInvalid(true);
      }
    }, 180);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={handleChange}
          onFocus={() => setShowList(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor="#8FA0B8"
          editable={!disabled}
          autoCorrect={false}
          autoCapitalize="words"
          style={[styles.input, invalid && styles.inputInvalid]}
          accessibilityLabel={label}
        />
        {loading ? <ActivityIndicator size="small" color="#2463EB" style={styles.spinner} /> : null}
      </View>

      {invalid ? <Text style={styles.invalidText}>{INVALID_MESSAGE}</Text> : null}

      {showList && suggestions.length > 0 ? (
        <View style={styles.list} accessibilityRole="list">
          {suggestions.map((item) => (
            <Pressable
              key={`${item.label}-${item.lat}-${item.lng}`}
              accessibilityRole="button"
              accessibilityLabel={`Choose destination ${item.label}`}
              onPress={() => handleSelect(item)}
              style={({ hovered, pressed }) => [
                styles.listItem,
                (hovered || pressed) && styles.listItemActive,
              ]}
            >
              <Text style={styles.listItemTitle} numberOfLines={1}>
                {item.label}
              </Text>
              {item.country ? (
                <Text style={styles.listItemMeta} numberOfLines={1}>
                  {[item.city, item.region, item.country].filter(Boolean).join(" · ")}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export { INVALID_MESSAGE };

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
    zIndex: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#445574",
  },
  inputRow: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D5DEEC",
    backgroundColor: "#F8FAFE",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingRight: 40,
    fontSize: 15,
    color: "#16284A",
  },
  inputInvalid: {
    borderColor: "#E11D48",
    backgroundColor: "#FFF1F2",
  },
  spinner: {
    position: "absolute",
    right: 12,
  },
  invalidText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#E11D48",
  },
  list: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D5DEEC",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  listItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6ECF5",
  },
  listItemActive: {
    backgroundColor: "#EEF4FF",
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#16284A",
  },
  listItemMeta: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7C99",
    fontWeight: "500",
  },
});
