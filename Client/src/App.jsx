import { useState } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from './components/Login/login.jsx';
import StudentsTable from './components/TestManagement/testManagement.jsx';
import StudentInfo from './components/StudentInfo/StudentInfo.jsx';
import Result from './components/Report/Report.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';


import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/TEstManagement" element={<StudentsTable />} />
        <Route path="/student-info" element={<StudentInfo />} />
        <Route path="/report" element={<Result/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>

    </BrowserRouter>
  )
}

export default App
