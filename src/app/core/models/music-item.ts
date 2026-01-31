export interface MusicItem {
  id: number;
  name: string;
  type: 'song' | 'album';
  artist: string;
  description?: string;
  imageUrl: string;
  releaseDate: string;
  collectionName?: string;
  genre?: string;
  previewUrl?: string;
}
