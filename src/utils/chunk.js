// Chunk long material by paragraphs to fit under maxChars
export const chunkMaterial = (text, maxChars) => {
  if (!text || text.length <= maxChars) return [text || ""];
  const parts = text.split(/\n\n+/);
  const chunks = [];
  let current = "";
  for (const p of parts) {
    const withPara = current ? current + "\n\n" + p : p;
    if (withPara.length <= maxChars) {
      current = withPara;
    } else {
      if (current) chunks.push(current);
      if (p.length > maxChars) {
        // hard split very long paragraph
        for (let i = 0; i < p.length; i += maxChars) {
          chunks.push(p.slice(i, i + maxChars));
        }
        current = "";
      } else {
        current = p;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
};
