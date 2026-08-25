import { forwardRef } from "react";

// Same per-word masking as RevealHeading, but flowed as plain inline text
// (no flex rows) so the browser's own wrapping/hyphenation handles a
// paragraph naturally instead of being forced line by line.
const RevealText = forwardRef(function RevealText(
  { text, as: Tag = "p", className },
  ref
) {
  const parts = [];
  const words = text.split(" ");
  words.forEach((word, i) => {
    parts.push(
      <span className="word-mask" key={`w${i}`}>
        <span className="word-inner">{word}</span>
      </span>
    );
    if (i < words.length - 1) parts.push(" ");
  });

  return (
    <Tag className={className} ref={ref}>
      {parts}
    </Tag>
  );
});

export default RevealText;
