import React, { useRef, useState } from 'react';
import { useInterval } from 'usehooks-ts';
import './App.css';
import logo from './logo.png';
import { Analytics } from '@vercel/analytics/react';

function App() {
  const [recordState, setRecordState] = useState({ recording: false, playing: false, chunks: [] });
  const recordedVideoRef = useRef();
  const [pipActive, setPipActive] = useState(false); // add this state
  const liveVideoRef = useRef();
  const mediaRecorder = useRef(null);

  // Add this state to manage the duration
  const [duration, setDuration] = useState(10); // default value is 10

  const handleStart = async () => {
    try {
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
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        window.alert('画面共有の許可が必要です。');
      } else {
        // Log or handle any other errors here.
        console.error(error);
      }
    }
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
      if (pipActive) {
        document.exitPictureInPicture();
        setPipActive(false);
      } else {
        await recordedVideoRef.current.requestPictureInPicture();
        setPipActive(true);
      }
    }
  };

  useInterval(() => {
    let blob = new Blob(recordState.chunks, { type: 'video/webm' });
    let url = URL.createObjectURL(blob);
    let currentTime = recordedVideoRef.current.currentTime;
    recordedVideoRef.current.src = url;
    recordedVideoRef.current.currentTime = currentTime;
  }, recordState.playing ? 1000 : null);

  const handleDurationChange = (e) => {
    const value = e.target.value;
    if (value >= 0 && value <= recordedVideoRef.current.duration / 60) {
      setDuration(value);
      recordedVideoRef.current.currentTime = value * 60;
    }
  };

  return (
    <div className="App">
      <div className="wrapper">
        <img className="title-image" src={logo} alt="title" />
        <div className="video-section">
          <div className={`video-container ${!recordState.recording ? 'inactive' : ''}`}>
            <video ref={liveVideoRef} className="video" autoPlay></video>
            <button onClick={recordState.recording ? handleStop : handleStart} className="record-button">
              {recordState.recording ? '■' : '配信を開始する'}
            </button>
            <label className="video-label">今の自分</label>
          </div>
          <div className={`video-container ${!recordState.playing ? 'inactive' : ''}`}>
            <video ref={recordedVideoRef} className="video" autoPlay controls></video>
            {
              recordState.playing && (<button onClick={handlePiP} className="pip-button">
                {pipActive ? 'オーバーレイを閉じる' : 'オーバーレイを表示'}
              </button>)
            }
            <label className="video-label">
              <input type="number" value={duration} min="0" onChange={handleDurationChange} className='duration-input'/> 分前の自分
            </label>
          </div>
        </div>
      </div>
      <Analytics />
    </div>
  );
}

export default App;
