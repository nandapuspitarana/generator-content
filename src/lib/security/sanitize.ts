import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes HTML string to prevent XSS attacks while keeping valid inline CSS styles.
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return "";

  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
      "img", "svg", "path", "circle", "rect", "line", "polyline", "polygon",
      "b", "i", "strong", "em", "small", "br", "hr", "ul", "ol", "li", "a"
    ],
    ALLOWED_ATTR: [
      "style", "class", "id", "src", "alt", "width", "height", "href", "target", "rel",
      "viewBox", "xmlns", "fill", "stroke", "stroke-width", "d", "cx", "cy", "r", "x", "y"
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|data:image\/):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: true,
  });
}
