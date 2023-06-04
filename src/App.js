import React, { useRef, useState } from 'react';
import { useInterval } from 'usehooks-ts';

function App() {
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isPlaying, setPlaying] = useState(false);
  const recordedVideoRef = useRef();
  let mediaRecorder = useRef(null);

  const handleStart = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always'
      },
      audio: false
    });

    mediaRecorder.current = new MediaRecorder(stream);
    mediaRecorder.current.ondataavailable = handleDataAvailable;
    mediaRecorder.current.start(100); // collect 100ms of data at a time
    setRecording(true);
    setPlaying(true);
  };

  const handleDataAvailable = (event) => {
    if (event.data && event.data.size > 0) {
      setRecordedChunks((prev) => [...prev, event.data]);
    }
  };

  const handleStop = () => {
    mediaRecorder.current.stop();
    mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
    setRecording(false);
    setPlaying(false);
  };

  const handlePiP = async () => {
    if (recordedVideoRef.current.requestPictureInPicture) {
      await recordedVideoRef.current.requestPictureInPicture();
    }
  };

  useInterval(() => {
    let blob = new Blob(recordedChunks, { type: 'video/webm' });
    let url = URL.createObjectURL(blob);
    let currentTime = recordedVideoRef.current.currentTime;
    recordedVideoRef.current.src = url;
    recordedVideoRef.current.currentTime = currentTime;
  }, isPlaying ? 1000 : null); // 10 minutes

  return (
    <div className="App">
      <h1>未来の自分への作業配信 Broadcast to your future self</h1>
      <button onClick={recording ? handleStop : handleStart}>
        {recording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <br />
      <button onClick={handlePiP} disabled={!recording}>
        {'Picture-in-Picture Mode'}
      </button>
      <h2>作業映像</h2>
      <video ref={recordedVideoRef} style={{"maxWidth": "50%"}} autoPlay controls></video>
    </div>
  );
}

export default App;
