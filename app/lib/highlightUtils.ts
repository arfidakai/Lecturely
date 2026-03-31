// Utility functions for text highlighting
//masih perlu di review

//bagian highklight utils ini masih belum kepake, tapi mungkin bisa dipake buat fitur highlight di summary nanti
// HighlightRange: Represents a highlighted portion of text with start and end offsets and a color  
// getSelectionRange: Gets the current text selection range within a specified container element
// renderHighlightedText: Renders text with highlights based on provided highlight ranges
// getHighlightColorClass: Returns a CSS class for a given highlight color
// getHighlightColorStyle: Returns an inline style object for a given highlight color
export type HighlightRange = {
  id?: string;
  startOffset: number;
  endOffset: number;
  color: string;
};

export const getSelectionRange = (containerElement: HTMLElement): { start: number; end: number; text: string } | null => {
  const selection = window.getSelection();
  if (!selection || selection.toString().length === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(containerElement);
  preCaretRange.setEnd(range.endContainer, range.endOffset);

  const start = preCaretRange.toString().length - range.toString().length;
  const end = start + range.toString().length;

  return {
    start,
    end,
    text: range.toString(),
  };
};

export const renderHighlightedText = (
  text: string,
  highlights: HighlightRange[]
): string => {
  if (!highlights || highlights.length === 0) {
    return text;
  }

  // Sort highlights by start offset
  const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);

  let result = "";
  let lastOffset = 0;

  for (const highlight of sorted) {
    // Add text before highlight
    if (highlight.startOffset > lastOffset) {
      result += text.substring(lastOffset, highlight.startOffset);
    }

    // Get color class
    const colorClass = getHighlightColorClass(highlight.color);

    // Add highlighted text
    const highlightedPart = text.substring(highlight.startOffset, highlight.endOffset);
    result += `<mark class="${colorClass}">${highlightedPart}</mark>`;

    lastOffset = highlight.endOffset;
  }

  // Add remaining text
  if (lastOffset < text.length) {
    result += text.substring(lastOffset);
  }

  return result;
};

export const getHighlightColorClass = (color: string): string => {
  switch (color) {
    case "yellow":
      return "bg-yellow-200";
    case "orange":
      return "bg-orange-200";
    case "red":
      return "bg-red-200";
    case "green":
      return "bg-green-200";
    case "blue":
      return "bg-blue-200";
    case "purple":
      return "bg-purple-200";
    case "pink":
      return "bg-pink-200";
    default:
      return "";
  }
};

export const getHighlightColorStyle = (color: string): React.CSSProperties => {
  switch (color) {
    case "yellow":
      return { backgroundColor: "#fef08a" };
    case "orange":
      return { backgroundColor: "#fed7aa" };
    case "red":
      return { backgroundColor: "#fecaca" };
    case "green":
      return { backgroundColor: "#bbf7d0" };
    case "blue":
      return { backgroundColor: "#bfdbfe" };
    case "purple":
      return { backgroundColor: "#e9d5ff" };
    case "pink":
      return { backgroundColor: "#fbcfe8" };
    default:
      return {};
  }
};
