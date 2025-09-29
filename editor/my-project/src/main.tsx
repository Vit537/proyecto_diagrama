import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode >
    <App />
    {/* <div className='bg-red-500'>hola herny</div> */}
  </StrictMode>,
)
