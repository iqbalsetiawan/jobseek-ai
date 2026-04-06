import { ImageResponse } from 'next/og';

export const alt = 'JobSeekAI';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 72,
        background:
          'linear-gradient(145deg, #fafafa 0%, #e4e4e7 45%, #d4d4d8 100%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 28,
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 22,
            background: '#171717',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: '#fafafa',
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1,
              fontFamily:
                'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            J
          </span>
        </div>
        <span
          style={{
            fontSize: 68,
            fontWeight: 700,
            letterSpacing: -0.02,
            color: '#171717',
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          JobSeekAI
        </span>
      </div>
      <p
        style={{
          marginTop: 36,
          fontSize: 34,
          lineHeight: 1.35,
          color: '#404040',
          maxWidth: 920,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        Helpful drafts for job applications — natural tone, easy to edit.
      </p>
    </div>,
    { ...size },
  );
}
