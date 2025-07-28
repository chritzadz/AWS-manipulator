import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import Bucket from './pages/Bucket'

//test
function App() {
  return(
    <>
      <BrowserRouter>
        <Routes>
          <Route index element={<SignIn />}/>
          <Route path='/home' element={<Home />}/>
          <Route path='/signin' element={<SignIn />}/>
          <Route path='/bucket' element={<Bucket />}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
