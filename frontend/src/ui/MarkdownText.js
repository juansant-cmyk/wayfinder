import { StyleSheet, Text } from "react-native";

/**
 * Lightweight markdown for chat bubbles: **bold**, *italic*, and "- " list lines.
 * Avoids adding a full markdown package for Expo.
 */
export default function MarkdownText({ text, style, boldStyle, italicStyle }) {
  const source = typeof text === "string" ? text : String(text ?? "");
  const lines = source.split("\n");

  return (
    <Text style={style}>
      {lines.map((line, lineIndex) => {
        const isList = /^\s*[-*]\s+/.test(line);
        const content = isList ? line.replace(/^\s*[-*]\s+/, "") : line;
        const prefix = isList ? "• " : "";

        return (
          <Text key={`line-${lineIndex}`}>
            {lineIndex > 0 ? "\n" : null}
            {prefix}
            {renderInline(content, boldStyle, italicStyle)}
          </Text>
        );
      })}
    </Text>
  );
}

function renderInline(text, boldStyle, italicStyle) {
  // **bold** then *italic* / _italic_ on remaining plain segments
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);

  return boldParts.map((part, index) => {
    const boldMatch = /^\*\*([^*]+)\*\*$/.exec(part);
    if (boldMatch) {
      return (
        <Text key={`b-${index}`} style={[styles.bold, boldStyle]}>
          {boldMatch[1]}
        </Text>
      );
    }

    const italicParts = part.split(/(\*[^*]+\*|_[^_]+_)/g);
    return italicParts.map((segment, segIndex) => {
      const italicMatch = /^\*([^*]+)\*$|^_([^_]+)_$/.exec(segment);
      if (italicMatch) {
        return (
          <Text key={`i-${index}-${segIndex}`} style={[styles.italic, italicStyle]}>
            {italicMatch[1] || italicMatch[2]}
          </Text>
        );
      }
      return segment ? (
        <Text key={`t-${index}-${segIndex}`}>{segment}</Text>
      ) : null;
    });
  });
}

const styles = StyleSheet.create({
  bold: {
    fontWeight: "700",
  },
  italic: {
    fontStyle: "italic",
  },
});
