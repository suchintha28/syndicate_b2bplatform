'use client'

import React from 'react'
import { Icon } from './icons'
import { Avatar, Button } from './ui'
import type { Screen } from '@/lib/data'

const NAV_ITEMS = [
  { id: 'home'     as Screen, label: 'Home',    icon: 'home'    },
  { id: 'listing'  as Screen, label: 'Explore', icon: 'compass' },
  { id: 'rfqs'     as Screen, label: 'RFQs',    icon: 'file'    },
  { id: 'messages' as Screen, label: 'Inbox',   icon: 'message' },
  { id: 'profile'  as Screen, label: 'Profile', icon: 'user'    },
]

interface NavProps {
  screen: Screen
  setScreen: (s: Screen) => void
  unreadCount: number
  savedCount?: number
  isProMember?: boolean
  isSignedIn?: boolean
  userInitials?: string
  userAvatarUrl?: string
  notifCount?: number
}

export function TopNav({ screen, setScreen, unreadCount, savedCount = 0, isProMember = false, isSignedIn = false, userInitials = '?', userAvatarUrl, notifCount = 0 }: NavProps) {
  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <button className="topnav-brand" onClick={() => setScreen('home')}>
          <img src="/logo-light.png" alt="Syndicate B2B Marketplace" className="topnav-logo topnav-logo-light" />
          <img src="/logo-dark.png"  alt="Syndicate B2B Marketplace" className="topnav-logo topnav-logo-dark"  />
          <span className="topnav-brand-name">Syndicate B2B Marketplace</span>
        </button>
        <div className="topnav-links">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`topnav-link ${screen === item.id || (item.id === 'listing' && screen === 'detail') ? 'active' : ''}`}
              onClick={() => setScreen(item.id)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {item.label}
                {item.id === 'messages' && unreadCount > 0 && (
                  <span className="nav-badge">{unreadCount}</span>
                )}
              </span>
            </button>
          ))}
        </div>
        <div className="topnav-right">
          <button
            className="btn btn-ghost btn-icon"
            aria-label="Saved"
            onClick={() => setScreen('saved' as Screen)}
            style={{ position: 'relative' }}
          >
            <Icon name="heart" size={18} />
            {savedCount > 0 && (
              <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: 999, background: 'var(--primary)' }} />
            )}
          </button>
          {isSignedIn && (
            <button
              className="btn btn-ghost btn-icon"
              aria-label="Notifications"
              onClick={() => setScreen('notifications' as Screen)}
              style={{ position: 'relative' }}
            >
              <Icon name="bell" size={18} />
              {notifCount > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  minWidth: 16, height: 16, borderRadius: 999,
                  background: 'var(--danger, #dc2626)', color: 'white',
                  fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center',
                  padding: '0 3px', lineHeight: 1,
                }}>
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>
          )}
          {isSignedIn && !isProMember && (
            <Button variant="dark" size="sm" icon="sparkle" onClick={() => setScreen('subscription' as Screen)}>Upgrade</Button>
          )}
          <button
            onClick={() => setScreen('profile')}
            aria-label="Profile"
            className={isSignedIn ? '' : 'btn btn-ghost btn-icon'}
            style={{ display: 'inline-flex' }}
          >
            {isSignedIn
              ? <Avatar src={userAvatarUrl} initials={userInitials} size="sm" />
              : <Icon name="user" size={18} />
            }
          </button>
        </div>
      </div>
    </nav>
  )
}

export function BottomNav({ screen, setScreen, unreadCount }: NavProps) {
  return (
    <nav className="botnav">
      {NAV_ITEMS.map(item => {
        const active = screen === item.id
        return (
          <button
            key={item.id}
            className={`botnav-item ${active ? 'active' : ''}`}
            onClick={() => setScreen(item.id)}
          >
            {item.id === 'messages' && unreadCount > 0 && (
              <span className="botnav-badge">{unreadCount}</span>
            )}
            <Icon name={item.icon} size={20} strokeWidth={active ? 2.2 : 1.8} />
            <span className="botnav-item-label">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function Footer({ goTo }: { goTo: (s: Screen) => void }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-brand-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-light.png" alt="Syndicate" height={28} style={{ display: 'block', height: 28, width: 'auto' }} />
              <span className="footer-brand-name">Syndicate B2B Marketplace</span>
            </div>
            <p className="footer-tagline">
              The B2B network for serious buyers. Verified suppliers, structured RFQs,
              transparent reviews.
            </p>
          </div>
          <div className="footer-col">
            <h4>Marketplace</h4>
            <ul>
              <li><button onClick={() => goTo('listing')}>Explore suppliers</button></li>
              <li><button onClick={() => goTo('rfqs')}>Browse RFQs</button></li>
              <li><button onClick={() => goTo('rfq-create')}>Post an RFQ</button></li>
              <li><button onClick={() => goTo('subscription')}>Pricing</button></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><button onClick={() => goTo('about')}>About us</button></li>
              <li><button onClick={() => goTo('contact')}>Contact us</button></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><button onClick={() => goTo('privacy')}>Privacy policy</button></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© 2026 Syndicate B2B Marketplace, Inc.</div>
          <div className="footer-bottom-links">
            <button onClick={() => goTo('about')}>About</button>
            <button onClick={() => goTo('contact')}>Contact</button>
            <button onClick={() => goTo('privacy')}>Privacy</button>
          </div>
        </div>
      </div>
    </footer>
  )
}
