import React, { useState, useEffect, useMemo } from 'react';

function App() {
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [status, setStatus] = useState("");

  // ⏱️ Update the timer every second if running
  useEffect(() => {
    let interval = null;

    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerRunning]);

  // 🧠 Dynamically compute rewards based on elapsedSeconds
  const totalRewards = useMemo(() => {
    const minutes = elapsedSeconds / 60;
    const rewardUnits = minutes / 60; // 1 reward unit = 60 minutes worked

    return {
      movie: rewardUnits * 10,
      youtube: rewardUnits * 5,
      instagram: rewardUnits * 1,
      snack_money: rewardUnits * 1.0
    };
  }, [elapsedSeconds]);

  // ▶️ Start timer (tell backend too)
  const startTimer = async () => {
    await fetch('http://localhost:5000/start', { method: 'POST' });
    setTimerRunning(true);
    setStatus("Timer started!");
  };

  // ⏹ Stop timer and sync with backend
  const stopTimer = async () => {
    const res = await fetch('http://localhost:5000/stop', { method: 'POST' });
    const data = await res.json();

    setStatus(`Worked ${data.worked_minutes} min`);
    setTimerRunning(false);

    const addedSeconds = data.worked_minutes * 60;
    setElapsedSeconds(prev => prev + addedSeconds);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>🎯 Discipline Timer</h1>

      <button onClick={startTimer} disabled={timerRunning}>
        ▶️ Start
      </button>
      <button onClick={stopTimer} disabled={!timerRunning}>
        ⏹ Stop
      </button>

      <h2 style={{ marginTop: "1rem" }}>
        ⏳ Elapsed Time: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
      </h2>

      <h3>📊 Total Rewards Earned:</h3>
      <ul>
        <li>🎬 Movie Time: {totalRewards.movie.toFixed(2)} min</li>
        <li>📺 YouTube Time: {totalRewards.youtube.toFixed(2)} min</li>
        <li>📱 Instagram Time: {totalRewards.instagram.toFixed(2)} min</li>
        <li>🍫 Snack Money: ${totalRewards.snack_money.toFixed(2)}</li>
      </ul>

      <p style={{ color: "green" }}>{status}</p>
    </div>
  );
}

export default App;
