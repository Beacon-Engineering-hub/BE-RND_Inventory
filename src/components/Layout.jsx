import { NavLink, useLocation } from 'react-router-dom';
import {
  SquaresFour, Package, SignOut, Handshake, ClipboardText,
  GearSix, Printer, ArrowLeft
} from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const NAV = [
  { section: 'Utama' },
  { to: '/', icon: SquaresFour, label: 'Dashboard' },
  { section: 'Inventaris' },
  { to: '/items', icon: Package, label: 'Data Barang' },
  { to: '/outgoing', icon: SignOut, label: 'Barang Keluar' },
  { section: 'Peminjaman' },
  { to: '/borrow/request', icon: ClipboardText, label: 'Ajukan Peminjaman' },
  { to: '/borrow/approval', icon: Handshake, label: 'Approval', hasBadge: true },
  { to: '/borrow/history', icon: ArrowLeft, label: 'Riwayat' },
  { section: 'Sistem' },
  { to: '/settings', icon: GearSix, label: 'Pengaturan' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    api.dashboard().then(res => {
      setPendingCount(res.data.pendingApproval || 0);
    }).catch(() => { });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <nav className="sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.25rem', paddingTop: '1rem', paddingBottom: '1rem' }}>
          <img src="/logo.png" alt="Logo Utama" style={{ width: '120px', height: 'auto', objectFit: 'contain', marginBottom: '0.25rem' }} />
          <div>
            <h1 style={{ lineHeight: 1.2, fontSize: '1.25rem', marginBottom: '0', fontWeight: 500 }}>Inventory RND</h1>
          </div>
        </div>
        {NAV.map((item, i) => {
          if (item.section) {
            return <div key={i} className="sidebar-section">{item.section}</div>;
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <Icon size={20} weight="duotone" />
              {item.label}
              {item.hasBadge && pendingCount > 0 && (
                <span className="sidebar-badge">{pendingCount}</span>
              )}
            </NavLink>
          );
        })}
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
