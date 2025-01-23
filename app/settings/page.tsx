'use client'

import ImportNsec from "../../components/organisms/ImportNsec"

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="space-y-6">
        <section className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <ImportNsec />
        </section>
      </div>
    </div>
  )
}