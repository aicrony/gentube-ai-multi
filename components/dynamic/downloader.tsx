import React from 'react';
import useDownloader from 'react-use-downloader';
import Button from '@/components/ui/Button';
import getFileNameFromUrl from '@/utils/stringUtils';

interface DownloaderProps {
  fileUrl: string;
}

export default function Downloader({ fileUrl }: DownloaderProps) {
  const { size, elapsed, percentage, download, cancel, error, isInProgress } =
    useDownloader();
  let filename = getFileNameFromUrl(fileUrl);
  if (
    filename === undefined ||
    filename === '' ||
    !['mp4'].includes(filename.split('.').pop() || '')
  ) {
    return (
      <div className="App">
        <p>You can only download a valid file.</p>
      </div>
    );
  }

  return (
    <div className="App">
      {/*<p>Download is {isInProgress ? 'in progress' : 'stopped'}</p>*/}
      <div>
        <Button onClick={() => download(fileUrl, filename)}>
          Download Video file
        </Button>
        {/*<p>Download size in bytes {size}</p>*/}
      </div>
      {isInProgress && (
        <>
          <div>
            <Button onClick={() => cancel()}>Cancel Download</Button>
          </div>
          <div>
            <label htmlFor="file">Downloading progress:</label>
            <progress id="file" value={percentage} max="100" />
            <p>Elapsed time in seconds {elapsed}</p>
            {error && <p>possible error {JSON.stringify(error)}</p>}
          </div>
        </>
      )}
    </div>
  );
}
