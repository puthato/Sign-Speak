import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FirstPage from './ui/FirstPage';
import SecondPage from './ui/SecondPage';
import ThirdPage from './ui/ThirdPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FirstPage />} />
        <Route path="/second" element={<SecondPage />} />
        <Route path="/third" element={<ThirdPage />} />
      </Routes>
    </Router>
  );
}

export default App;
