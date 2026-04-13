import { Navigate, RouterProvider, createBrowserRouter } from 'react-router'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'

import "@fontsource-variable/roboto/wght.css";

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/map',
    element: <MapPage />,
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
