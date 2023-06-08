import React, { useRef, useState } from 'react';
import { useInterval } from 'usehooks-ts';
import './App.css';
import logo from './logo.png';
import { Analytics } from '@vercel/analytics/react';

function App() {
  const [recordState, setRecordState] = useState({ recording: false, playing: false, chunks: [] });
  const recordedVideoRef = useRef();
  const liveVideoRef = useRef();
  const mediaRecorder = useRef(null);

  const handleStart = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always'
      },
      audio: false
    });

    liveVideoRef.current.srcObject = stream;
    mediaRecorder.current = new MediaRecorder(stream);
    mediaRecorder.current.ondataavailable = handleDataAvailable;
    mediaRecorder.current.start(100); 
    setRecordState({ ...recordState, recording: true, playing: true });
  };

  const handleDataAvailable = (event) => {
    if (event.data && event.data.size > 0) {
      setRecordState((prev) => ({ ...prev, chunks: [...prev.chunks, event.data] }));
    }
  };

  const handleStop = () => {
    mediaRecorder.current.stop();
    mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
    liveVideoRef.current.srcObject = null;
    setRecordState({ ...recordState, recording: false, playing: false, chunks: [] });
  };

  const handlePiP = async () => {
    if (recordedVideoRef.current.requestPictureInPicture) {
      await recordedVideoRef.current.requestPictureInPicture();
    }
  };

  useInterval(() => {
    let blob = new Blob(recordState.chunks, { type: 'video/webm' });
    let url = URL.createObjectURL(blob);
    let currentTime = recordedVideoRef.current.currentTime;
    recordedVideoRef.current.src = url;
    recordedVideoRef.current.currentTime = currentTime;
  }, recordState.playing ? 1000 : null);

  return (
    <div className="App">
      <img className="title-image" src={logo} alt="title" />
      <div className="video-section">
        <div className="video-container">
          <video ref={liveVideoRef} className="video" autoPlay></video>
          <button onClick={recordState.recording ? handleStop : handleStart} className="record-button">
            {recordState.recording ? '配信を停止する' : '配信を開始する'}
          </button>
          <label className="video-label">今の自分</label>
        </div>
        <div className="video-container">
          <video ref={recordedVideoRef} className="video" autoPlay controls></video>
          <button onClick={handlePiP} disabled={!recordState.recording} className="pip-button">
            {'オーバーレイで見る'}
          </button>
          <label className="video-label">過去の自分</label>
        </div>
      </div>
    </div>
  );
}

export default App;
