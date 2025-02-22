import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge'
};

export default function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || '';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
          color: 'black',
          fontSize: 60,
          fontWeight: 'bold'
        }}
      >
        <img
          src={
            'https://storage.googleapis.com/gen-image-storage/og/gentube-ai-og.png'
          }
          alt={'Screenshot of Gentube.ai'}
        />
      </div>
    ),
    {
      width: 920,
      height: 890
    }
  );
}
