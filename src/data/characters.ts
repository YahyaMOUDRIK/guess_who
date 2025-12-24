export interface Character {
  id: number;
  name: string;
  image: string;
}

// 12 characters - update names to match your image files
// Image files should be placed in public/characters/ folder
// Supported formats: .png, .jpg, .jpeg, .webp
export const characters: Character[] = [
  { id: 1, name: "Character 1", image: "/characters/1.png" },
  { id: 2, name: "Character 2", image: "/characters/2.png" },
  { id: 3, name: "Character 3", image: "/characters/3.png" },
  { id: 4, name: "Character 4", image: "/characters/4.png" },
  { id: 5, name: "Character 5", image: "/characters/5.png" },
  { id: 6, name: "Character 6", image: "/characters/6.png" },
  { id: 7, name: "Character 7", image: "/characters/7.png" },
  { id: 8, name: "Character 8", image: "/characters/8.png" },
  { id: 9, name: "Character 9", image: "/characters/9.png" },
  { id: 10, name: "Character 10", image: "/characters/10.png" },
  { id: 11, name: "Character 11", image: "/characters/11.png" },
  { id: 12, name: "Character 12", image: "/characters/12.png" },
];

// Shuffle array using Fisher-Yates algorithm
export function shuffleCharacters(chars: Character[]): Character[] {
  const shuffled = [...chars];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
