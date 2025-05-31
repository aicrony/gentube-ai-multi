export interface EmotionItem {
  id: string;
  name: string;
  desc: string;
}

export const emotions: EmotionItem[] = [
  { id: 'happy', name: 'Happy', desc: 'joyful and uplifting mood' },
  { id: 'calm', name: 'Calm', desc: 'peaceful and serene atmosphere' },
  { id: 'energetic', name: 'Energetic', desc: 'dynamic and vibrant energy' },
  { id: 'nostalgic', name: 'Nostalgic', desc: 'warm nostalgic feeling' },
  { id: 'dramatic', name: 'Dramatic', desc: 'intense dramatic mood' },
  {
    id: 'mysterious',
    name: 'Mysterious',
    desc: 'enigmatic mysterious atmosphere'
  },
  { id: 'romantic', name: 'Romantic', desc: 'romantic atmosphere' },
  { id: 'melancholy', name: 'Melancholy', desc: 'subtle melancholic mood' },
  { id: 'playful', name: 'Playful', desc: 'playful lighthearted feeling' },
  { id: 'elegant', name: 'Elegant', desc: 'elegant sophisticated ambiance' },
  { id: 'cozy', name: 'Cozy', desc: 'warm and cozy feeling' },
  { id: 'dreamy', name: 'Dreamy', desc: 'dreamy ethereal atmosphere' },
  { id: 'inspiring', name: 'Inspiring', desc: 'inspirational mood' },
  { id: 'intimate', name: 'Intimate', desc: 'intimate personal feeling' },
  { id: 'bold', name: 'Bold', desc: 'bold and confident expression' }
];
