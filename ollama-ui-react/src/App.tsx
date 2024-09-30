// import { useState } from 'react'
import './App.css'
import './assets/bootstrap.min.css'
import Chat from "./components/Chat"

function App() {
  // const [count, setCount] = useState(0)

  return (
    <>

      {/* <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div> */}
      <Chat />
    </>
  )
}

export default App
