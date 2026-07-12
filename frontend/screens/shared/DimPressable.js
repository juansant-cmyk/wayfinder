import { Pressable, StyleSheet } from "react-native";

// White + light black shade (~8% black over #FFFFFF)
const HOVER_BACKGROUND = "#EBEBEB";

/**
 * Pressable for white-background buttons only.
 * On hover (web), applies a light black shade. No press/click opacity change.
 */
export default function DimPressable({ style, children, disabled = false, ...rest }) {
  return (
    <Pressable
      disabled={disabled}
      style={(state) => {
        const resolved = typeof style === "function" ? style(state) : style;
        return [
          styles.base,
          resolved,
          !disabled && state.hovered && styles.hoverShade,
        ];
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

  hoverShade: {
    backgroundColor: HOVER_BACKGROUND,
  },
});
