import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/custom-styles.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./views/NotFound";
import Intro from "./views/Intro";
import Main from "./views/Main";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<NotFound/>} />
        <Route path="/" element={<Intro/>} />
        <Route path="/main" element={<Main/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;