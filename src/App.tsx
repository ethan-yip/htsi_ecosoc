import { Navigate, RouterProvider, createBrowserRouter } from 'react-router'
import InputPage from './pages/InputPage'
import MapPage from './pages/MapPage'

import "@fontsource-variable/roboto/wght.css";

const router = createBrowserRouter([
  {
    path: '/',
    element: <MapPage />,
  },
  {
    path: '/input',
    element: <InputPage />,
  },
  {
    path: '*',
    element: <Navigate to='/' replace />,
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
