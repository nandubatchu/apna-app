import { NextResponse } from 'next/server';
import { getFaviconUrl } from '@/lib/utils';

interface FavoriteApp {
  name: string;
  appUrl: string;
  appId: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pubkey = searchParams.get('pubkey');
  const favorites = searchParams.get('favorites');

  let shortcuts: any[] = [];
  
  if (favorites) {
    try {
      const favoriteApps: FavoriteApp[] = JSON.parse(decodeURIComponent(favorites));
      shortcuts = favoriteApps.map(app => ({
        name: app.name,
        short_name: app.name,
        url: `/?appUrl=${encodeURIComponent(app.appUrl)}&appId=${app.appId}`,
        icons: [{
          // The favicon endpoint will return a PNG or fall back to default icon
          src: `/api/favicon?appUrl=${encodeURIComponent(app.appUrl)}`,
          sizes: "192x192",
          type: "image/png",
          purpose: "any"
        }, {
          // Also include default icon as fallback
          src: "/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable"
        }]
      }));
    } catch (error) {
      console.error('Error parsing favorites:', error);
    }
  }
  // console.log(pubkey, favorites, shortcuts)
  const manifest = {
    theme_color: "#368564",
    background_color: "#f8faf9",
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    start_url: "/",
    name: "Apna",
    short_name: "Apna",
    description: "Discover and launch apps in the Apna ecosystem",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icon-256x256.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-256x256.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    shortcuts
  };

  return new NextResponse(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}