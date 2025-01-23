'use client'

import React from 'react'
import { Sheet, SheetContent, SheetTrigger } from '../../ui/sheet'
import { Button } from '../../ui/button'
import { User, Settings } from 'lucide-react'
import Link from 'next/link'
import { getKeyPairFromLocalStorage } from '../../../lib/utils'

export default function UserDrawer() {
  const keyPair = getKeyPairFromLocalStorage()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-[#e6efe9]">
          <User className="w-5 h-5 text-[#368564]" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px]">
        <div className="flex flex-col h-full">
          <div className="flex-1 py-4">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#368564]">
                {keyPair ? 'Account' : 'Sign In Required'}
              </h2>
              {!keyPair && (
                <p className="text-sm text-gray-500 mt-2">
                  Please import your Nsec key to access account features
                </p>
              )}
            </div>
            <nav className="space-y-2">
              <Link href="/settings">
                <Button variant="ghost" className="w-full justify-start hover:bg-[#e6efe9]">
                  <Settings className="w-5 h-5 mr-2 text-[#368564]" />
                  <span className="text-gray-700">Settings</span>
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}