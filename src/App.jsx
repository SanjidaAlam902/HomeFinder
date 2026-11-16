import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import Layout from "./components/layout/Layout"
import { AppDataProvider } from "./context/AppDataContext"
import { AuthProvider } from "./context/AuthContext"
import About from "./pages/About"
import AdminDashboard from "./pages/admin/AdminDashboard"
import Browse from "./pages/Browse"
import Home from "./pages/Home"
import Login from "./pages/Login"
import OwnerDashboard from "./pages/owner/OwnerDashboard"
import PropertyDetails from "./pages/PropertyDetails"
import Register from "./pages/Register"
import Saved from "./pages/Saved"

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/property/:id" element={<PropertyDetails />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/saved"
                element={
                  <ProtectedRoute roles={["seeker"]}>
                    <Saved />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute roles={["owner"]}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppDataProvider>
    </AuthProvider>
  )
}
