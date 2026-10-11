import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import { bestImage } from "../lib/strapi.js";

/**
 * Renders a Strapi "blocks" rich-text field using the site's own type tokens,
 * so CMS copy sits in the same rhythm as the hardcoded one instead of arriving
 * as unstyled browser defaults.
 *
 * Every block type the editor can produce is mapped here. Anything Strapi adds
 * later falls back to the library's own component.
 */

const HEADINGS = {
  1: "t-h2",
  2: "t-h3l",
  3: "t-h4",
  4: "t-h5",
  5: "t-h6",
  6: "t-h6",
};

const blocks = {
  paragraph: ({ children }) => <p className="t-body">{children}</p>,

  heading: ({ level, children }) => {
    const Tag = `h${Math.min(Math.max(level ?? 2, 1), 6)}`;
    return <Tag className={HEADINGS[level] ?? "t-h4"}>{children}</Tag>;
  },

  quote: ({ children }) => (
    <blockquote className="t-body border-l-2 border-ink/20 pl-4 italic">{children}</blockquote>
  ),

  list: ({ format, children }) => {
    const Tag = format === "ordered" ? "ol" : "ul";
    return <Tag className="t-body flex list-disc list-inside flex-col gap-2 pl-1">{children}</Tag>;
  },

  "list-item": ({ children }) => <li>{children}</li>,

  code: ({ plainText }) => (
    <pre className="t-body overflow-x-auto rounded-lg bg-mist p-4">
      <code>{plainText}</code>
    </pre>
  ),

  // Strapi hands the block the whole media object, so the same medium/small/
  // original choice and alt-text fallback apply here as everywhere else.
  image: ({ image }) => {
    const src = bestImage(image, image?.alternativeText || "");
    if (!src) return null;
    return (
      <img
        src={src.src}
        alt={src.alt}
        loading="lazy"
        className="h-auto w-full rounded-lg object-cover"
      />
    );
  },

  link: ({ url, children }) => (
    <a href={url} className="t-link underline underline-offset-4">
      {children}
    </a>
  ),
};

/**
 * `content` is the raw blocks array. Renders nothing when the field is empty or
 * missing, which is what lets a page fall back to its own copy.
 */
export default function Blocks({ content, className = "" }) {
  if (!Array.isArray(content) || content.length === 0) return null;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <BlocksRenderer content={content} blocks={blocks} />
    </div>
  );
}