import React from 'react';

interface VideoListProps {
  videos: { [key: string]: string };
}

const VideoList = ({ videos }: VideoListProps) => {
  return (
    <div className={'video-container'}>
      {Object.keys(videos).map((key) => (
        <div key={key} className="video-item">
          <h2>{key}</h2>
          <video width="100%" height="auto" controls>
            <source src={videos[key]} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      ))}
    </div>
  );
};

export default VideoList;
