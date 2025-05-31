export interface StyleItem {
  id: string;
  name: string;
  desc: string;
}

export const styles: StyleItem[] = [
  { id: 'photo', name: 'Photography', desc: 'high-resolution photography' },
  { id: 'cartoon', name: 'Cartoon', desc: 'cartoon style' },
  { id: 'digital', name: 'Digital Art', desc: 'digital art style' },
  { id: 'watercolor', name: 'Watercolor', desc: 'watercolor painting' },
  { id: 'oil', name: 'Oil Paint', desc: 'oil painting' },
  { id: 'retro', name: 'Retro', desc: 'retro style from the 80s' },
  { id: 'anime', name: 'Anime', desc: 'anime art style' },
  { id: 'pixel', name: 'Pixel Art', desc: 'pixel art style' },
  { id: 'minimalist', name: 'Minimalist', desc: 'minimalist design' },
  {
    id: 'impressionist',
    name: 'Impressionist',
    desc: 'impressionist painting style'
  },
  { id: 'vector', name: 'Vector', desc: 'vector graphic' },
  { id: 'pop', name: 'Pop Art', desc: 'pop art style' },
  { id: 'abstract', name: '3D Abstract', desc: '3D abstract art' },
  { id: 'cinematic', name: 'Cinematic', desc: 'cinematic shot' },
  { id: 'vaporwave', name: 'Vaporwave', desc: 'vaporwave aesthetic' }
];
