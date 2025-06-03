import Hls from 'hls.js';
import { useEffect, useRef } from 'react';

type Props = {
  src: string;
};

export default function HlsPlayer({ src }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(videoRef.current);
    } else if (videoRef.current.canPlayType('video/mp2t')) {
      videoRef.current.src = src;
    }
  }, [src]);

  return (
    <video ref={videoRef} controls width='640' height='360'>
      <source src={src} type='video/mp2t' />
    </video>
  );
}
