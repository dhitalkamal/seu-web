import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "@/features/events/pages/HomePage";

/** Root router -- add routes here as pages are implemented. */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
