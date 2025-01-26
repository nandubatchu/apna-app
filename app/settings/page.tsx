'use client'

import ImportNsec from "../../components/organisms/ImportNsec"
import { PWAReinstallButton } from "@/components/PWAReinstallButton"

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="space-y-6">
        <section className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <ImportNsec />
        </section>

        <section className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">PWA Settings</h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              If you need to update your PWA installation (for example, to refresh shortcuts or app data),
              you can reinstall the PWA using the button below.
            </p>
            <PWAReinstallButton />
          </div>
        </section>
      </div>
    </div>
  )
}