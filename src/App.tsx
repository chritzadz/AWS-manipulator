import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import SignIn from './pages/SignIn'

function App() {
  return(
    <>
      <BrowserRouter>
        <Routes>
          <Route index element={<SignIn />}/>
          <Route path='/home' element={<Home />}/>
          <Route path='/SignIn' element={<SignIn />}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
