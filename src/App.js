import React, { useRef, useState, useEffect } from 'react';
import { useInterval } from 'usehooks-ts';
import './App.css';
import logo from './images/logo.png';
import clockIcon from './images/clock_icon.png';
import { Analytics } from '@vercel/analytics/react';

function App() {
  const [recordState, setRecordState] = useState({ recording: false, playing: false, chunks: [] });
  const recordedVideoRef = useRef();
  const [pipActive, setPipActive] = useState(false); // add this state
  const liveVideoRef = useRef();
  const mediaRecorder = useRef(null);

  // Add this state to manage the duration
  const [delayDuration, setDelayDuration] = useState(300); // default value is 300 seconds

  useEffect(() => {
    if (recordedVideoRef.current) {
      const handleEnterPictureInPicture = () => setPipActive(true);
      const handleLeavePictureInPicture = () => setPipActive(false);

      recordedVideoRef.current.addEventListener('enterpictureinpicture', handleEnterPictureInPicture);
      recordedVideoRef.current.addEventListener('leavepictureinpicture', handleLeavePictureInPicture);

      return () => {
        recordedVideoRef.current.removeEventListener('enterpictureinpicture', handleEnterPictureInPicture);
        recordedVideoRef.current.removeEventListener('leavepictureinpicture', handleLeavePictureInPicture);
      };
    }
  }, []);

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
        if (recordedVideoRef.current.readyState >= 1) {  // Checks if metadata is loaded
          await recordedVideoRef.current.requestPictureInPicture();
          setPipActive(true);
        } else {
          alert("映像が読み込まれるまでオーバーレイ表示は出来ません。");
        }
      }
    }
  };

  const playbackPoint = () => {
    if (recordedVideoRef.current === undefined) return 0;
    const currentRecordingDuration = recordedVideoRef.current.duration;
    console.log(currentRecordingDuration);
    return currentRecordingDuration - delayDuration;
  }

  useInterval(() => {
    const currentTime = recordedVideoRef.current.currentTime;
    console.log(recordedVideoRef.current.currentTime);
    let blob = new Blob(recordState.chunks, { type: 'video/webm' });
    let url = URL.createObjectURL(blob);
    recordedVideoRef.current.src = url;
    recordedVideoRef.current.currentTime = currentTime;
    // if (playbackPoint() > 0) {
    //   recordedVideoRef.current.currentTime = playbackPoint();
    // } else {
    //   recordedVideoRef.current.currentTime = 0;
    // }
    // console.log(playbackPoint())

  }, recordState.playing ? 5000 : null);

  const handleDurationChange = (e) => {
    const value = e.target.value;
    if (value >= 0 && value <= recordedVideoRef.current.duration / 60) {
      setDelayDuration(value);
    }
  };

  return (
    <div className="App">
      <div className='title-section'>
        <img className="title-image" src={logo} alt="タイムサボリモニター" />
        <img className='clock-icon clock-icon-1' src={clockIcon} />
        <img className='clock-icon clock-icon-2' src={clockIcon} />
        <img className='clock-icon clock-icon-3' src={clockIcon} />
        <img className='clock-icon clock-icon-4' src={clockIcon} />
      </div>
      <div className="description-section">
        <div className='description-large'>
          <p>過去のあなたがサボってないか</p>
          <p>よく監視しましょう</p>
        </div>
        <div className='description-small'>
        <p>タイムサボりモニターは、過去のあなたの画面を</p>
        <p>今のあなたに配信することで、あなたの作業を応援するサービスです。</p>
        </div>
      </div>
      <div className="video-section">
        <div className={`video-container ${!recordState.playing ? 'inactive' : ''}`}>
          <label className="video-label">
            5分前のあなた
          </label>
          <video ref={recordedVideoRef} className="video" autoPlay controls></video>
          {
            recordState.playing &&
            (<button onClick={handlePiP} className="pip-button">
              {pipActive ? 'オーバーレイを閉じる' : 'オーバーレイを表示'}
            </button>)
          }
          {
            // (playbackPoint() < 0) && (
            //   <div className="overlay">
            //     <div className="overlay-text">
            //       配信開始まであと{-1}分
            //     </div>
            //   </div>
            // )
          }
        </div>
        <div className={`video-container ${!recordState.recording ? 'inactive' : ''}`}>
          <label className="video-label">今のあなた</label>
          <video ref={liveVideoRef} className="video" autoPlay></video>
          <button onClick={recordState.recording ? handleStop : handleStart} className="record-button">
            {recordState.recording ? '停止' : 'モニターを開始する'}
          </button>
        </div>
      </div>
      <Analytics />
    </div>
  );
}

export default App;
