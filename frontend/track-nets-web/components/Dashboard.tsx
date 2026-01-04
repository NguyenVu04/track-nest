import { useState } from 'react';
import { 
  Users, 
  FileText, 
  Shield, 
  BookOpen, 
  LogOut, 
  UserCircle,
  Menu,
  X
} from 'lucide-react';
import type { User } from '../App';
import { MissingPersonDashboard } from './MissingPersonDashboard';
import { CrimeDashboard } from './CrimeDashboard';
import { GuidelineDashboard } from './GuidelineDashboard';
import { UserProfile } from './UserProfile';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type View = 'missing-persons' | 'crime-reports' | 'guidelines' | 'profile';

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentView, setCurrentView] = useState<View>('missing-persons');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { id: 'missing-persons', name: 'Missing Persons', icon: Users },
    { id: 'crime-reports', name: 'Crime Reports', icon: Shield },
    { id: 'guidelines', name: 'Guidelines', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-gray-900">TRACK Dashboard</h1>
              <p className="text-gray-600 text-sm">{user.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('profile')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <UserCircle className="w-5 h-5" />
              <span className="hidden sm:inline">{user.fullName}</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-20 w-64 bg-white border-r border-gray-200
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            mt-[73px] lg:mt-0
          `}
        >
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id as View);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-indigo-50 text-indigo-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {currentView === 'missing-persons' && <MissingPersonDashboard user={user} />}
          {currentView === 'crime-reports' && <CrimeDashboard user={user} />}
          {currentView === 'guidelines' && <GuidelineDashboard user={user} />}
          {currentView === 'profile' && <UserProfile user={user} />}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
