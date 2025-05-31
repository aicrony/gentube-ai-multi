export interface EffectItem {
  id: string;
  name: string;
  desc: string;
}

export const effects: EffectItem[] = [
  { id: 'hdr', name: 'HDR', desc: 'HDR lighting' },
  { id: 'vibrant', name: 'Vibrant', desc: 'vibrant colors' },
  { id: 'glow', name: 'Neon Glow', desc: 'neon glow effect' },
  { id: 'bokeh', name: 'Bokeh', desc: 'bokeh background' },
  { id: 'dramatic', name: 'Dramatic', desc: 'dramatic lighting' },
  { id: 'sunset', name: 'Sunset', desc: 'sunset lighting' },
  { id: 'blur', name: 'Blur', desc: 'background blur' },
  { id: 'grainy', name: 'Grainy', desc: 'grainy texture' },
  { id: 'sharp', name: 'Ultra Sharp', desc: 'ultra sharp details' },
  { id: 'fog', name: 'Fog', desc: 'light fog effect' },
  { id: 'gritty', name: 'Gritty', desc: 'gritty texture' },
  { id: 'motion', name: 'Motion Blur', desc: 'motion blur effect' },
  { id: 'shadow', name: 'Long Shadow', desc: 'long shadow effect' },
  { id: 'ethereal', name: 'Ethereal', desc: 'ethereal glow' },
  { id: 'cyberpunk', name: 'Cyberpunk', desc: 'cyberpunk lighting' }
];
