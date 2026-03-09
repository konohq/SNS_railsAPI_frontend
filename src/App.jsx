import { useEffect, useState } from "react";

function App() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/tasks")
      .then(res => res.json())
      .then(data => {
        console.log(data);
        setTasks(data);
      })
      .catch(err => console.error("エラー:", err));
  }, []);

  return (
    <div>
      <h1>Task一覧</h1>
      {tasks.map(task => (
        <p key={task.id}>{task.title}</p>
      ))}
    </div>
  );
}

export default App;