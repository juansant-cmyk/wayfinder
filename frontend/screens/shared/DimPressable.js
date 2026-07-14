import { Pressable, StyleSheet } from "react-native";

// White + light black shade (~8% black over #FFFFFF)
const HOVER_BACKGROUND = "#EBEBEB";

/**
 * Pressable for white-background buttons.
 * Hover (web) and press/hold: light black shade over white.
 */
export default function DimPressable({ style, children, disabled = false, ...rest }) {
  return (
    <Pressable
      disabled={disabled}
      style={(state) => {
        const resolved = typeof style === "function" ? style(state) : style;
        const shaded = !disabled && (state.hovered || state.pressed);
        return [styles.base, resolved, shaded && styles.blackShade];
      }}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    transitionProperty: "background-color",
    transitionDuration: "140ms",
    transitionTimingFunction: "ease-out",
  },

  blackShade: {
    backgroundColor: HOVER_BACKGROUND,
  },
});
