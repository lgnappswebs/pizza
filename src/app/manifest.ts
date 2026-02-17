
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pizza App',
    short_name: 'Pizza',
    description: 'Peça sua pizza favorita com rapidez e facilidade.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6C2BD9',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
