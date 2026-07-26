import { Photo, GuestMessage } from '../types';

export const initialPhotos: Photo[] = [
  {
    id: 'demo-1',
    photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
    authorName: 'Bianca & Pedro',
    caption: '14 anos de cumplicidade, sorrisos e muito amor! Bodas de Marfim ✨',
    likes: 24,
    filter: 'normal',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'demo-2',
    photoUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
    authorName: 'Padrinhos Juliana e Lucas',
    caption: 'Um brinde a essa união linda! Parabéns Bianca e Pedro 🥂',
    likes: 18,
    filter: 'romantico',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
  },
  {
    id: 'demo-3',
    photoUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800',
    authorName: 'Família Silva',
    caption: 'Comemorando cada momento desta festa inesquecível! ❤️',
    likes: 12,
    filter: 'pb',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  }
];

export const initialMessages: GuestMessage[] = [
  {
    id: 'msg-1',
    authorName: 'Tia Carmen & Tio Roberto',
    content: 'Bianca e Pedro, que esses 14 anos de Bodas de Marfim sejam apenas o começo de mais décadas repletas de harmonia e muitas alegrias. Amamos vocês!',
    category: 'desejo',
    likes: 15,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'msg-2',
    authorName: 'Gabriel e Sofia',
    content: 'Lembro como se fosse ontem do casamento de vocês! Que inspiração de casal. Parabéns por manterem essa chama acesa com tanto carinho!',
    category: 'lembranca',
    likes: 11,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'msg-3',
    authorName: 'Mariana (Prima)',
    content: 'Que festa linda e que vibe maravilhosa! Vocês merecem todo o amor do mundo. Viva Bianca e Pedro! 🎉💍',
    category: 'carinho',
    likes: 9,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  }
];
