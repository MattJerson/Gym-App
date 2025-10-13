/*import Chat from "./pages/Chat";*/
import Users from "./pages/Users";
import Meals from "./pages/Meals";
import Badges from "./pages/Badges";
import Workouts from "./pages/Workouts";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Sidebar from "./components/Sidebar";
import Subscriptions from "./pages/Subscriptions";
import Notifications from "./pages/Notifications";
import FeaturedContent from "./pages/FeaturedContent";
import Login from "./pages/Auth/Login";
import { withAdminAuth } from "./middleware/adminAuth";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import IdleTimeout from "./components/IdleTimeout";

// Protect all admin routes
const ProtectedDashboard = withAdminAuth(Dashboard);
const ProtectedUsers = withAdminAuth(Users);
const ProtectedSubscriptions = withAdminAuth(Subscriptions);
const ProtectedAnalytics = withAdminAuth(Analytics);
const ProtectedNotifications = withAdminAuth(Notifications);
const ProtectedBadges = withAdminAuth(Badges);
const ProtectedWorkouts = withAdminAuth(Workouts);
const ProtectedMeals = withAdminAuth(Meals);
const ProtectedFeaturedContent = withAdminAuth(FeaturedContent);

function App() {
  return (
    <BrowserRouter>
      <Routes>
  {/* Public routes */}
  <Route path="/login" element={<Login />} />
        
        {/* Protected admin routes */}
        <Route
          path="/*"
          element={
            <IdleTimeout>
            <div className="flex min-h-screen bg-gray-50">
              {/* Sidebar - Fixed position */}
              <Sidebar />
              {/* Main Content - Full width, no margin (pages handle their own padding) */}
              <main className="flex-1 overflow-x-hidden bg-gray-50">
                <Routes>
                  <Route index element={<ProtectedDashboard />} />
                  <Route path="dashboard" element={<ProtectedDashboard />} />
                  <Route path="users" element={<ProtectedUsers />} />
                  <Route path="subscriptions" element={<ProtectedSubscriptions />} />
                  <Route path="analytics" element={<ProtectedAnalytics />} />
                  <Route path="notifications" element={<ProtectedNotifications />} />
                  <Route path="badges" element={<ProtectedBadges />} />
                  <Route path="workouts" element={<ProtectedWorkouts />} />
                  <Route path="meals" element={<ProtectedMeals />} />
                  <Route path="featured" element={<ProtectedFeaturedContent />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
            </IdleTimeout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
