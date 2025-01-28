'use client'

import React, { useState, ChangeEvent, useEffect } from 'react'
import { Button } from '../../../components/ui/button'
import { ArrowLeft } from 'lucide-react'
import UserDrawer from '../UserDrawer'
import { usePathname, useRouter } from 'next/navigation'

interface TopBarProps {
  appId?: string;
  appName?: string;
  onClose?: () => void;
  showBackButton?: boolean;
}

export default function TopBar(props: TopBarProps = {}) {
  const { appId, appName, onClose, showBackButton } = props
  const pathname = usePathname()
  const router = useRouter()

  const getPageTitle = () => {
    if (appName) return appName
    
    switch (pathname) {
      case '/':
        return 'Apna'
      case '/explore':
        return 'Explore Apps'
      case '/settings':
        return 'User Settings'
      case '/feedback':
        return 'Community Feedback'
      case '/my-apps':
        return 'My Apps'
      default:
        return appName || ''
    }
  }

  const handleBackClick = () => {
    if (onClose) {
      onClose()
    } else {
      router.back()
    }
  }

  const isSimpleHeader = pathname === '/settings' || pathname === '/feedback' || pathname === '/my-apps' || !!appId
  const displayBackButton = showBackButton || isSimpleHeader

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center">
      <div className="flex items-center gap-3">
        {displayBackButton && (
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-[#e6efe9]"
            onClick={handleBackClick}
          >
            <ArrowLeft className="w-5 h-5 text-[#368564]" />
          </Button>
        )}
        {!isSimpleHeader && <UserDrawer />}
        <h1 className="text-lg font-semibold text-[#368564]">
          {getPageTitle()}
        </h1>
      </div>

    </div>
  )
}