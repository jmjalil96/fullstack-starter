/**
 * Users Management Page
 * Page with tabs for Users and Invitations management
 * Note: Employees and Agents have their own dedicated pages at /admin/empleados and /admin/agentes
 */

import { useState } from 'react'

import { PageHeader } from '../../../../shared/components/ui/layout/PageHeader'

import { InvitationsList } from './InvitationsList'
import { InviteUserModal } from './InviteUserModal'
import { UsersList } from './UsersList'

type TabKey = 'users' | 'invitations'

interface Tab {
  key: TabKey
  label: string
}

const TABS: Tab[] = [
  { key: 'users', label: 'Usuarios' },
  { key: 'invitations', label: 'Invitaciones' },
]

export function UsersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('users')
  const [inviteModalOpen, setInviteModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6">
      {/* Header */}
      <PageHeader
        title="Gestión de Usuarios"
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Usuarios' },
        ]}
      />

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.key
                  ? 'border-[var(--color-navy)] text-[var(--color-navy)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'users' && <UsersList />}
        {activeTab === 'invitations' && (
          <InvitationsList onInviteClick={() => setInviteModalOpen(true)} />
        )}
      </div>

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  )
}
