import { NextResponse } from 'next/server';
import { getFaviconUrl } from '@/lib/utils';
import sharp from 'sharp';

export async function GET(request: Request) {
  const defaultIconPath = '/icon-192x192.png';
  try {
    const { searchParams } = new URL(request.url);
    const appUrl = searchParams.get('appUrl');

    if (!appUrl) {
      return new NextResponse('Missing appUrl parameter', { status: 400 });
    }

    // First try to fetch the HTML to find favicon link
    const pageResponse = await fetch(appUrl);
    const html = await pageResponse.text();
    
    // Try to find favicon link in HTML
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["'][^>]*>/i)
      || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i);

    let faviconUrl;
    if (faviconMatch) {
      const href = faviconMatch[1];
      // Convert relative URL to absolute if needed
      faviconUrl = new URL(href, appUrl).toString();
    } else {
      // Fall back to default favicon.ico path
      faviconUrl = getFaviconUrl(appUrl);
    }

    console.log('Using favicon URL:', faviconUrl);

    // Fetch the favicon
    const response = await fetch(faviconUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch favicon: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    console.log('Favicon content type:', contentType);

    // Get the favicon buffer
    const buffer = await response.arrayBuffer();

    // If it's an SVG, we need to handle it differently
    if (contentType?.includes('svg')) {
      return new NextResponse(Buffer.from(buffer), {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    try {
      // Try different image formats
      let imageBuffer;
      try {
        // First try with default options
        imageBuffer = await sharp(Buffer.from(buffer))
          .resize(192, 192, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .png()
          .toBuffer();
      } catch (firstError) {
        console.error('First conversion attempt failed:', firstError);
        
        // If ICO format, try extracting the largest image
        if (contentType?.includes('x-icon')) {
          try {
            imageBuffer = await sharp(Buffer.from(buffer), { page: -1 }) // -1 selects the largest image
              .resize(192, 192, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 }
              })
              .png()
              .toBuffer();
          } catch (icoError) {
            console.error('ICO conversion failed:', icoError);
            throw icoError;
          }
        } else {
          throw firstError;
        }
      }

      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    } catch (conversionError) {
      console.error('Image conversion error:', conversionError);
      console.error('Content type was:', contentType);
      console.error('URL was:', faviconUrl);
      
      // Try to fetch and process the default icon
      try {
        const defaultIconResponse = await fetch(new URL(defaultIconPath, request.url).toString());
        const defaultIconBuffer = await defaultIconResponse.arrayBuffer();
        const defaultImageBuffer = await sharp(Buffer.from(defaultIconBuffer))
          .resize(192, 192)
          .png()
          .toBuffer();
        
        return new NextResponse(defaultImageBuffer, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      } catch (defaultIconError) {
        console.error('Failed to process default icon:', defaultIconError);
        // If even the default icon fails, return a JSON response
        return NextResponse.json({ error: 'Image processing failed' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Favicon fetch/parse error:', error);
    return NextResponse.json({ error: 'Failed to fetch or parse favicon' }, { status: 500 });
  }
}