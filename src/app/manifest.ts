
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pizza App - O Sabor Original',
    short_name: 'PizzApp',
    description: 'Peça sua pizza favorita com rapidez e facilidade.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#FF4136',
    icons: [
      {
        src: 'https://picsum.photos/seed/pizzapp-logo/192/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://picsum.photos/seed/pizzapp-logo/512/512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
