// Define the structure of our image styles
export interface ImageStyle {
  id: string;
  label: string;
  promptSuffix: string;
}

export interface ImageCategory {
  id: string;
  label: string;
  styles: ImageStyle[];
}

// Define the categories and styles (sorted alphabetically)
export const imageCategories: ImageCategory[] = [
  {
    id: 'artistic',
    label: 'Artistic Styles',
    styles: [
      { id: 'abstract', label: 'Abstract', promptSuffix: 'in abstract style' },
      { id: 'artdeco', label: 'Art Deco', promptSuffix: 'in art deco style' },
      { id: 'artnouveou', label: 'Art Nouveau', promptSuffix: 'in art nouveau style' },
      { id: 'baroque', label: 'Baroque', promptSuffix: 'in baroque style' },
      { id: 'cubism', label: 'Cubism', promptSuffix: 'in cubist style' },
      { id: 'expressionist', label: 'Expressionist', promptSuffix: 'in expressionist style' },
      { id: 'fauvism', label: 'Fauvism', promptSuffix: 'in fauvist style' },
      { id: 'impressionist', label: 'Impressionist', promptSuffix: 'in impressionist style' },
      { id: 'minimalist', label: 'Minimalist', promptSuffix: 'in minimalist style' },
      { id: 'photorealistic', label: 'Photorealistic', promptSuffix: 'in photorealistic style' },
      { id: 'pointillism', label: 'Pointillism', promptSuffix: 'in pointillist style' },
      { id: 'popart', label: 'Pop Art', promptSuffix: 'in pop art style' },
      { id: 'renaissance', label: 'Renaissance', promptSuffix: 'in renaissance style' },
      { id: 'surrealism', label: 'Surrealism', promptSuffix: 'in surrealist style' },
      { id: 'ukiyoe', label: 'Ukiyo-e', promptSuffix: 'in ukiyo-e style' }
    ]
  },
  {
    id: 'commercial',
    label: 'Commercial & Design Uses',
    styles: [
      { id: 'albumcover', label: 'Album Cover', promptSuffix: 'as an album cover' },
      { id: 'billboard', label: 'Billboard', promptSuffix: 'as a billboard design' },
      { id: 'bookcover', label: 'Book Cover', promptSuffix: 'as a book cover' },
      { id: 'brand', label: 'Brand Identity', promptSuffix: 'as brand identity design' },
      { id: 'businesscard', label: 'Business Card', promptSuffix: 'as a business card design' },
      { id: 'iconset', label: 'Icon Set', promptSuffix: 'as an icon set' },
      { id: 'infographic', label: 'Infographic', promptSuffix: 'as an infographic' },
      { id: 'logo', label: 'Logo', promptSuffix: 'as a logo design' },
      { id: 'magazinecover', label: 'Magazine Cover', promptSuffix: 'as a magazine cover' },
      { id: 'packaging', label: 'Packaging', promptSuffix: 'as packaging design' },
      { id: 'poster', label: 'Poster', promptSuffix: 'as a poster design' },
      { id: 'socialmedia', label: 'Social Media Post', promptSuffix: 'as a social media post' },
      { id: 'ui', label: 'UI/UX Elements', promptSuffix: 'as UI/UX design elements' }
    ]
  },
  {
    id: 'digital',
    label: 'Digital & Modern Styles',
    styles: [
      { id: '3drender', label: '3D Render', promptSuffix: 'as a 3D render' },
      { id: '3disometric', label: '3D Isometric', promptSuffix: 'as a 3D isometric render' },
      { id: 'ar', label: 'AR Element', promptSuffix: 'as an AR element' },
      { id: 'cgi', label: 'CGI', promptSuffix: 'as CGI' },
      { id: 'digitalpainting', label: 'Digital Painting', promptSuffix: 'as a digital painting' },
      { id: 'gameart', label: 'Game Art', promptSuffix: 'as video game art' },
      { id: 'generativeart', label: 'Generative Art', promptSuffix: 'as generative art' },
      { id: 'hologram', label: 'Hologram', promptSuffix: 'as a hologram' },
      { id: 'lowpoly', label: 'Low Poly', promptSuffix: 'in low poly style' },
      { id: 'nftart', label: 'NFT Art', promptSuffix: 'as NFT art' },
      { id: 'vr', label: 'VR Environment', promptSuffix: 'as a VR environment' }
    ]
  },
  {
    id: 'film',
    label: 'Film & Cinema Inspired',
    styles: [
      { id: 'cinematic', label: 'Cinematic', promptSuffix: 'with cinematic lighting and composition' },
      { id: 'documentary', label: 'Documentary', promptSuffix: 'in documentary style' },
      { id: 'fantasy_film', label: 'Fantasy', promptSuffix: 'in fantasy film style' },
      { id: 'filmstill', label: 'Film Still', promptSuffix: 'as a film still' },
      { id: 'filmnoir', label: 'Film Noir', promptSuffix: 'in film noir style' },
      { id: 'horror', label: 'Horror', promptSuffix: 'in horror film style' },
      { id: 'movieposter', label: 'Movie Poster', promptSuffix: 'as a movie poster' },
      { id: 'scifi', label: 'Science Fiction', promptSuffix: 'in science fiction film style' },
      { id: 'storyboard', label: 'Storyboard', promptSuffix: 'as a film storyboard' },
      { id: 'western', label: 'Western', promptSuffix: 'in western film style' }
    ]
  },
  {
    id: 'illustration',
    label: 'Illustration Styles',
    styles: [
      { id: 'anime', label: 'Anime', promptSuffix: 'in anime style' },
      { id: 'caricature', label: 'Caricature', promptSuffix: 'as a caricature' },
      { id: 'cartoon', label: 'Cartoon', promptSuffix: 'in cartoon style' },
      { id: 'childrensbook', label: 'Children\'s Book', promptSuffix: 'as children\'s book illustration' },
      { id: 'comic', label: 'Comic Book', promptSuffix: 'in comic book style' },
      { id: 'conceptart', label: 'Concept Art', promptSuffix: 'as concept art' },
      { id: 'fantasy', label: 'Fantasy Art', promptSuffix: 'in fantasy art style' },
      { id: 'manga', label: 'Manga', promptSuffix: 'in manga style' },
      { id: 'pixelart', label: 'Pixel Art', promptSuffix: 'in pixel art style' },
      { id: 'storybook', label: 'Storybook Illustration', promptSuffix: 'as a storybook illustration' },
      { id: 'technical', label: 'Technical Illustration', promptSuffix: 'as a technical illustration' },
      { id: 'vectorart', label: 'Vector Art', promptSuffix: 'in vector art style' }
    ]
  },
  {
    id: 'interior',
    label: 'Interior & Environmental Design',
    styles: [
      { id: 'architectural_viz', label: 'Architectural Visualization', promptSuffix: 'as architectural visualization' },
      { id: 'furnituredesign', label: 'Furniture Design', promptSuffix: 'as furniture design' },
      { id: 'gardendesign', label: 'Garden Design', promptSuffix: 'as garden design' },
      { id: 'interiordesign', label: 'Interior Design', promptSuffix: 'as interior design' },
      { id: 'landscapedesign', label: 'Landscape Design', promptSuffix: 'as landscape design' },
      { id: 'lightingdesign', label: 'Lighting Design', promptSuffix: 'as lighting design' },
      { id: 'officespace', label: 'Office Space', promptSuffix: 'as office space design' },
      { id: 'restaurantdesign', label: 'Restaurant Design', promptSuffix: 'as restaurant design' },
      { id: 'retailspace', label: 'Retail Space', promptSuffix: 'as retail space design' },
      { id: 'roomlayout', label: 'Room Layout', promptSuffix: 'as room layout design' }
    ]
  },
  {
    id: 'specialized',
    label: 'Specialized Effects & Techniques',
    styles: [
      { id: 'charcoal', label: 'Charcoal Drawing', promptSuffix: 'as a charcoal drawing' },
      { id: 'doubleexposure', label: 'Double Exposure', promptSuffix: 'with double exposure effect' },
      { id: 'glitchart', label: 'Glitch Art', promptSuffix: 'with glitch art effect' },
      { id: 'holographic', label: 'Holographic', promptSuffix: 'with holographic effect' },
      { id: 'inkdrawing', label: 'Ink Drawing', promptSuffix: 'as an ink drawing' },
      { id: 'neon', label: 'Neon', promptSuffix: 'with neon effect' },
      { id: 'oilpainting', label: 'Oil Painting', promptSuffix: 'as an oil painting' },
      { id: 'pencilsketch', label: 'Pencil Sketch', promptSuffix: 'as a pencil sketch' },
      { id: 'silhouette', label: 'Silhouette', promptSuffix: 'as a silhouette' },
      { id: 'watercolor', label: 'Watercolor', promptSuffix: 'in watercolor style' }
    ]
  },
  {
    id: 'visual_media',
    label: 'Visual Media Types',
    styles: [
      { id: 'aerial', label: 'Aerial/Drone', promptSuffix: 'as aerial/drone photography' },
      { id: 'architectural', label: 'Architectural', promptSuffix: 'as architectural photography' },
      { id: 'cityscape', label: 'Cityscape', promptSuffix: 'as a cityscape' },
      { id: 'fashion', label: 'Fashion Photography', promptSuffix: 'as fashion photography' },
      { id: 'food', label: 'Food Photography', promptSuffix: 'as food photography' },
      { id: 'landscape', label: 'Landscape', promptSuffix: 'as a landscape' },
      { id: 'macro', label: 'Macro Photography', promptSuffix: 'as macro photography' },
      { id: 'night', label: 'Night Photography', promptSuffix: 'as night photography' },
      { id: 'portrait', label: 'Portrait', promptSuffix: 'as a portrait' },
      { id: 'product', label: 'Product Photography', promptSuffix: 'as product photography' },
      { id: 'seascape', label: 'Seascape', promptSuffix: 'as a seascape' },
      { id: 'stilllife', label: 'Still Life', promptSuffix: 'as a still life' },
      { id: 'street', label: 'Street Photography', promptSuffix: 'as street photography' },
      { id: 'wildlife', label: 'Wildlife', promptSuffix: 'as wildlife photography' }
    ]
  }
];

// Helper function to get all categories (sorted alphabetically)
export const getCategories = () => {
  return imageCategories
    .map(category => ({
      id: category.id,
      label: category.label
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

// Helper function to get styles for a specific category (already sorted alphabetically)
export const getStylesByCategory = (categoryId: string) => {
  const category = imageCategories.find(cat => cat.id === categoryId);
  return category ? category.styles : [];
};

// Helper function to get a specific style by its ID
export const getStyleById = (styleId: string) => {
  for (const category of imageCategories) {
    const style = category.styles.find(style => style.id === styleId);
    if (style) {
      return style;
    }
  }
  return null;
};
