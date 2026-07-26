export interface Photo {
  id: string;
  photoUrl: string;
  authorName: string;
  caption?: string;
  likes: number;
  filter?: string;
  createdAt: string;
}

export interface GuestMessage {
  id: string;
  authorName: string;
  content: string;
  category: 'desejo' | 'lembranca' | 'carinho';
  likes: number;
  createdAt: string;
}

export interface GuestUser {
  name: string;
}
