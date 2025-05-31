import React from 'react';

interface YouTubeVideoProps {
  videos: { [key: string]: string };
}

const YouTubeVideo = ({ videos }: YouTubeVideoProps) => {
  return (
    <div>
      {Object.keys(videos).map((key) => {
        const videoId = videos[key].split('v=')[1];
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;

        return (
          <div key={key}>
            <h2>{key}</h2>
            <iframe
              width="560"
              height="315"
              src={embedUrl}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube video player"
            ></iframe>
          </div>
        );
      })}
    </div>
  );
};

export default YouTubeVideo;
