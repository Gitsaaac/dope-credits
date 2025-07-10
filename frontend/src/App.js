import React, { useState, useEffect, useMemo } from 'react';

function App() {
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [status, setStatus] = useState("");
  const [rewards, setRewards] = useState({});
  const [manualMinutes, setManualMinutes] = useState("");
  const [rewardType, setRewardType] = useState("movie");
  const [rewardAmount, setRewardAmount] = useState("");

  // Start timer function
  const startTimer = async () => {
    await fetch('http://localhost:5000/start', { method: 'POST' });
    setElapsedSeconds(0); // reset session time
    setTimerRunning(true);
    setStatus("Timer started");
  };

  // Stop timer
  const stopTimer = async () => {
    const res = await fetch('http://localhost:5000/stop', { method: 'POST' });
    const data = await res.json();
    setTimerRunning(false);
    setElapsedSeconds(0); // clear local session time
    setRewards(data.rewards);
    setStatus(`Worked ${data.worked_minutes} minutes`);
  };

  // Update timer locally
  useEffect(() => {
    let interval;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000); //every 1000ms it increases by a second
    }
    return () => clearInterval(interval);
  }, [timerRunning]); //this effect runs everytime timerRunning changes

  // Fetch status on load
  useEffect(() => {
    fetch('http://localhost:5000/status')
      .then(res => res.json())
      .then(data => {
        setRewards(data.rewards);
        setStatus("Status loaded");
      });
  }, []);

  // 🧠 Calculate session rewards from elapsedSeconds
  const liveRewards = useMemo(() => { //this should change when elapsed seconds changes
    const minutes = elapsedSeconds / 60;
    const rewardUnits = minutes / 60;
    return {
      movie: rewardUnits * 10,
      youtube: rewardUnits * 5,
      instagram: rewardUnits * 1,
      snack_money: rewardUnits * 1.0
    };
  }, [elapsedSeconds]); //this determines when liveRewards changes

  // Use reward
  const useReward = async () => {
    const res = await fetch('http://localhost:5000/use_reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: rewardType, amount: parseFloat(rewardAmount) })
    });
    const data = await res.json();
    setStatus(data.message);
    setRewards(data.rewards)
    setRewardAmount(""); //clear input
  };

  // Manually add time
  const addManualTime = async () => {
    const res = await fetch('http://localhost:5000/manual_add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minutes: parseInt(manualMinutes) }) //user input 
    });
    const data = await res.json();
    setStatus(data.message);
    setRewards(data.rewards);
    setManualMinutes(""); // clear input
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>🎯 Discipline Timer</h1>
      <button onClick={startTimer} disabled={timerRunning}>▶️ Start</button>
      <button onClick={stopTimer} disabled={!timerRunning}>⏹ Stop</button>

      <h2>⏳ Session Time: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s</h2>

      <h3>📊 Total Rewards</h3>
      <ul>
        <li>🎬 Movie: {(rewards.movie + liveRewards.movie).toFixed(2)} min</li>
        <li>📺 YouTube: {(rewards.youtube + liveRewards.youtube).toFixed(2)} min</li>
        <li>📱 Instagram: {(rewards.instagram + liveRewards.instagram).toFixed(2)} min</li>
        <li>🍫 Snack Money: ${(rewards.snack_money + liveRewards.snack_money).toFixed(2)}</li>
      </ul>

      <div style={{ marginTop: "1rem" }}>
        <h4>➕ Manually Add Time</h4>
        <input
          type="number"
          placeholder="Minutes"
          value={manualMinutes}
          onChange={(e) => setManualMinutes(e.target.value)}
        />
        <button onClick={addManualTime}>Add Time</button>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <h4>🎁 Use Reward</h4>
        <select value={rewardType} onChange={(e) => setRewardType(e.target.value)}>
          <option value="movie">Movie</option>
          <option value="youtube">YouTube</option>
          <option value="instagram">Instagram</option>
          <option value="snack_money">Snack Money</option>
        </select>
        <input
          type="number"
          placeholder="Amount"
          value={rewardAmount}
          onChange={(e) => setRewardAmount(e.target.value)}
        />
        <button onClick={useReward}>Use</button>
      </div>

      <p style={{ color: "purple" }}>{status}</p>
    </div>
  );
}

export default App;
