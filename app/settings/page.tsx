'use client'

import { useState } from "react"
import ImportNsec from "../../components/organisms/ImportNsec"
import { PWAReinstallButton } from "@/components/PWAReinstallButton"
import { AlertTriangle } from "lucide-react"
import OpenRouteApiKeySettings from "@/components/molecules/OpenRouteApiKeySettings"

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="space-y-6">
        <section className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-medium mb-4">Profile Management</h3>
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    You can manage your Nostr profiles below. You can use either local keys (stored in your browser)
                    or connect to remote signers for enhanced security.
                  </p>
                </div>
              </div>
              <ImportNsec />
            </div>
          </div>
        </section>

        <section className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">API Settings</h2>
          <OpenRouteApiKeySettings />
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