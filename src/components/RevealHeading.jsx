import { forwardRef } from "react";

// Renders each `lines` entry as its own flex row (matching the old manual
// <br/> breaks) with every word individually masked, so a parent component
// can animate `.word-inner` for a cascading per-word reveal instead of a
// flat fade.
const RevealHeading = forwardRef(function RevealHeading(
  { lines, as: Tag = "h2", className },
  ref
) {
  return (
    <Tag className={className} ref={ref}>
      {lines.map((line, li) => (
        <span className="line-mask" key={li}>
          {line.split(" ").map((word, wi) => (
            <span className="word-mask" key={wi}>
              <span className="word-inner">{word}</span>
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
});

export default RevealHeading;
