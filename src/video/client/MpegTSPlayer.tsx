import { useEffect, useRef } from 'react';
import mpegts from 'mpegts.js';

type Props = {
  src: string;
};

export default function MpegTsPlayer({ src }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current === null) return;

    if (mpegts.getFeatureList().mseLivePlayback && mpegts.isSupported()) {
      const player = mpegts.createPlayer({
        type: 'mpegts',
        isLive: false,
        url: src
      });

      player.attachMediaElement(videoRef.current);
      player.load();
      player.play();

      return () => {
        player.unload();
        player.detachMediaElement();
        player.destroy();
      };
    } else {
      // fallback для браузеров без MSE (например, Safari)
      if (videoRef.current.canPlayType('video/mp2t')) {
        videoRef.current.src = src;
      }
    }
  }, [src]);

  return <video ref={videoRef} controls width='640' height='360' />;
}
