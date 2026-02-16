import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SortTheBalls from "./SortTheBalls";
import Landingpage from "./Startingpage";
import Loading from "./Loading";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landingpage />} />
         <Route path="/loading" element={<Loading />} />
        <Route path="/game" element={<SortTheBalls />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
