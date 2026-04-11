import { useState } from 'react'
import Sidebar from './Sidebar'
import Dashboard from './Dashboard'

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <Dashboard activeTab={activeTab} />
    </div>
  )
}

export default MainApp