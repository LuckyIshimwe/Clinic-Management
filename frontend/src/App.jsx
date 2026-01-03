import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'



import Login from './components/Login'
import Register from './components/Register'
import DoctorDashboard from './components/DoctorDashboard';
import NurseDashboard from './components/NurseDashboard';
import PharmacistDashboard from './components/PharmacistDashboard';
import ProtectedRoute from './components/protectedRoute';
import ReceptionistDashboard from './components/RecepDashboard';



function App() {
  return (
    <Router>
      <Routes>
       
        <Route path="/" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route 
          path="/doctor" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/nurse" 
          element={
            <ProtectedRoute allowedRoles={['nurse']}>
              <NurseDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/pharmacist" 
          element={
            <ProtectedRoute allowedRoles={['pharmacist']}>
              <PharmacistDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/receptionist" 
          element={
            <ProtectedRoute allowedRoles={['receptionist']}>
              <ReceptionistDashboard />
            </ProtectedRoute>
          } 
        /> 
      </Routes>
    </Router>
  )
}

export default App
