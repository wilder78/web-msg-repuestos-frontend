const normalizeWords = (value) =>
  String(value ?? "")
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, ""))
    .filter(Boolean);

export const getUserInitials = (...values) => {
  for (const value of values) {
    const words = normalizeWords(value);

    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }

    if (words.length === 1 && words[0].length >= 2) {
      return words[0].slice(0, 2).toUpperCase();
    }

    if (words.length === 1 && words[0].length === 1) {
      return words[0].toUpperCase();
    }
  }

  return "U";
};
