import charactersData from "../../characters.json";

export interface Character {
  id: string;
  name: string;
  image: string;
}

export const characters: Character[] = Object.entries(charactersData).map(([filename, name], index) => ({
  id: filename, // Using filename as ID for uniqueness
  name: name,
  image: `/characters/${filename}`,
}));

// Shuffle array using Fisher-Yates algorithm
export function shuffleCharacters(chars: Character[]): Character[] {
  const shuffled = [...chars];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getRandomCharacters(count: number): Character[] {
  return shuffleCharacters(characters).slice(0, count);
}
