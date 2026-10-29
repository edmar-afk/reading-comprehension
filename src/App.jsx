import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./routes/Login";
import Dashboard from "./routes/Dashboard";
import Test from "./routes/Test";
import Students from "./routes/Students";
import ReadingMaterials from "./routes/ReadingMaterials";
import StartReading from "./routes/StartReading";
import Analytics from "./routes/Analytics";
function Logout() {
  localStorage.clear();
  return <Navigate to="/" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/reading-materials" element={<ReadingMaterials />} />
        <Route path="/start-reading/:id" element={<StartReading />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/test" element={<Test />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
