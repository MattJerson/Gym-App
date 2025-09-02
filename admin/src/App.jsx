import Chat from "./pages/Chat";
import Users from "./pages/Users";
import Meals from "./pages/Meals";
import Badges from "./pages/Badges";
import Workouts from "./pages/Workouts";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Sidebar from "./components/Sidebar";
import Subscriptions from "./pages/Subscriptions";
import Notifications from "./pages/Notifications";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <div className="flex">
        {/* Sidebar is hidden on mobile */}
        <div className="md:block">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-4 sm:p-6 bg-gray-100 min-h-screen">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="chat" element={<Chat />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="badges" element={<Badges />} />
            <Route path="workouts" element={<Workouts />} />
            <Route path="meals" element={<Meals />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
