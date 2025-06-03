import { useState } from 'react';
// import axios from 'axios';
// import HlsPlayer from './HlsPlayer';
import MpegTsPlayer from './MpegTSPlayer';

export default function VideoPlayer() {
  const [publicLink, setPublicLink] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');

  const getVideoLink = async () => {
    try {
      // const res = await axios.post('http://localhost:5001/api/get-direct-link', {
      //   publicKey: publicLink,
      // });
      // setVideoUrl(res.data.directLink);
      const res = await fetch(
        `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${publicLink}`
      );
      const data = await res.json();
      setVideoUrl(data.href);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Ошибка при получении видео');
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <p>
        <i>example: https://disk.yandex.ru/i/ORh4Ph3Ng3QJ3Q</i>{' '}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', alignContent: 'center' }}>
        <input
          type='text'
          value={publicLink}
          onChange={e => setPublicLink(e.target.value)}
          placeholder='Вставьте ссылку Яндекс.Диска'
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button onClick={getVideoLink}>Получить видео</button>
      </div>

      {videoUrl && (
        <MpegTsPlayer src={videoUrl} />
        // <video width="640" height="360" controls style={{ marginTop: '1rem' }}>
        //   <source src={videoUrl} type="video/mp2t" />
        //   Ваш браузер не поддерживает видео.
        // </video>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
