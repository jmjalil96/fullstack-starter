import { Link } from 'react-router-dom'

import { Button } from '../../shared/components/ui/forms/Button'
import { useAuthStore } from '../../store/authStore'

export function Home() {
  const { user, isAuthenticated, signOut, isAuthenticating } = useAuthStore()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Welcome to Travel App</h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover amazing destinations and plan your perfect journey
          </p>

          {/* Auth Status Display - TEMPORARY */}
          <div className="bg-white rounded-lg shadow p-4 mb-8 inline-block">
            <p className="text-sm font-medium text-gray-700 mb-2">🧪 Auth Store Status:</p>
            <div className="text-left space-y-1 text-sm">
              <p>
                <span className="font-medium">Authenticated:</span>{' '}
                <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                  {isAuthenticated ? '✓ Yes' : '✗ No'}
                </span>
              </p>
              {user && (
                <>
                  <p>
                    <span className="font-medium">User:</span> {user.name}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ready to explore?</h2>
          <p className="text-gray-600 mb-6">
            {isAuthenticated
              ? 'Access your dashboard to manage bookings and preferences'
              : 'Sign in to access your dashboard and manage your travel plans'}
          </p>
          <div className="flex gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button variant="primary" size="lg">
                    Go to Dashboard
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSignOut}
                  isLoading={isAuthenticating}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="primary" size="lg">
                    Sign In
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="outline" size="lg">
                    Try Dashboard
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-lg p-6 text-center shadow">
            <div className="text-4xl mb-2">✈️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Flights</h3>
            <p className="text-sm text-gray-600">Book flights to destinations worldwide</p>
          </div>
          <div className="bg-white rounded-lg p-6 text-center shadow">
            <div className="text-4xl mb-2">🏨</div>
            <h3 className="font-semibold text-gray-900 mb-2">Hotels</h3>
            <p className="text-sm text-gray-600">Find perfect accommodations</p>
          </div>
          <div className="bg-white rounded-lg p-6 text-center shadow">
            <div className="text-4xl mb-2">🗺️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Explore</h3>
            <p className="text-sm text-gray-600">Discover new destinations</p>
          </div>
        </div>
      </div>
    </div>
  )
}
