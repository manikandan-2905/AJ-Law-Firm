import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import MainApp from './components/MainApp'
import Vendor from './components/Vendor'
import EC from './components/Ec'
import Nagal from './components/Nagal'
import Aggrement from './components/Aggrement'
import Deed from './components/Deed'
import Payment from './components/Payment'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<MainApp />} />
        <Route path="/vendor" element={<Vendor />} />
        <Route path="/ec" element={<EC />} />
        <Route path="/nagal" element={<Nagal />} />
        <Route path="/aggrement" element={<Aggrement />} />
        <Route path="/deed" element={<Deed />} />
        <Route path="/payment" element={<Payment />} />
      </Routes>
    </Router>
  )
}

export default App
