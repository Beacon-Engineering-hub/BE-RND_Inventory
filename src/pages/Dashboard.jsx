import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import { Package, SignOut, Handshake, Warning, CubeTransparent, ArrowRight } from '@phosphor-icons/react';

function StatSkeleton() {
  return (
    <div className="card stat-card">
      <div className="skeleton" style={{ width: 40, height: 40 }} />
      <div className="skeleton" style={{ width: 60, height: 32 }} />
      <div className="skeleton" style={{ width: 100, height: 16 }} />
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard().then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header"><div><h2>Dashboard</h2><p>Ringkasan inventory ruang RND</p></div></div>
        <div className="bento-grid stats">
          {[1,2,3,4].map(i => <StatSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!data) return <div className="empty-state"><Warning size={48} /><h3>Gagal memuat data</h3><p>Periksa koneksi server backend</p></div>;

  const stats = [
    { icon: Package, label: 'Total Barang', value: data.total, color: 'var(--color-accent)', bg: 'var(--color-accent-soft)' },
    { icon: CubeTransparent, label: 'Tersedia', value: data.available, color: 'var(--color-accent)', bg: 'var(--color-accent-soft)' },
    { icon: Handshake, label: 'Dipinjam', value: data.borrowed, color: 'var(--color-info)', bg: 'var(--color-info-soft)' },
    { icon: SignOut, label: 'Keluar', value: data.out, color: 'var(--color-warning)', bg: 'var(--color-warning-soft)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Ringkasan inventory ruang RND</p>
        </div>
        {data.pendingApproval > 0 && (
          <Link to="/borrow/approval" className="btn btn-primary btn-sm">
            {data.pendingApproval} menunggu approval <ArrowRight size={14} />
          </Link>
        )}
      </div>

      <div className="bento-grid stats">
        {stats.map((s, i) => (
          <div key={i} className="card stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>
              <s.icon size={20} weight="duotone" color={s.color} />
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bento-grid dashboard" style={{ marginTop: '1rem' }}>
        {/* Recent Items */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 650 }}>Barang Terbaru</h3>
            <Link to="/items" className="btn btn-outline btn-sm">Lihat Semua</Link>
          </div>
          {data.recentItems.length === 0 ? (
            <div className="empty-state"><Package size={32} /><p>Belum ada barang</p></div>
          ) : (
            <table className="data-table">
              <thead><tr><th style={{ width: 40 }}>Foto</th><th>Kode</th><th>Nama</th><th>Status</th></tr></thead>
              <tbody>
                {data.recentItems.map(item => {
                  let imgUrl = null;
                  if (item.image_url) {
                    const match = item.image_url.match(new RegExp('/d/(.+?)/')) || item.image_url.match(new RegExp('\\\\?id=(.+?)(&|$)'));
                    imgUrl = match ? `https://lh3.googleusercontent.com/d/${match[1] || match[2]}` : item.image_url;
                  }
                  return (
                    <tr key={item.id}>
                      <td>
                        {imgUrl ? (
                          <img src={imgUrl} alt="Foto" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 32, height: 32, borderRadius: 4, background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={16} color="var(--color-text-muted)" /></div>
                        )}
                      </td>
                      <td className="code">{item.item_code}</td>
                      <td>{item.item_name}</td>
                      <td><StatusBadge status={item.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Categories */}
        <div className="card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 650, marginBottom: '1rem' }}>Kategori</h3>
          {data.categories.length === 0 ? (
            <div className="empty-state"><p>Belum ada kategori</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.categories.map((cat, i) => (
                <div key={i} className="flex-between" style={{ padding: '0.5rem 0', borderBottom: i < data.categories.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <span style={{ fontSize: '0.875rem' }}>{cat.category}</span>
                  <span className="text-mono" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{cat.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Borrows */}
      {data.activeBorrows.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 650 }}>Peminjaman Aktif</h3>
            <Link to="/borrow/history" className="btn btn-outline btn-sm">Riwayat</Link>
          </div>
          <table className="data-table">
            <thead><tr><th>Peminjam</th><th>Divisi</th><th>Tgl Pinjam</th><th>Rencana Kembali</th><th>Status</th></tr></thead>
            <tbody>
              {data.activeBorrows.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 550 }}>{b.borrower_name}</td>
                  <td>{b.division}</td>
                  <td className="text-mono" style={{ fontSize: '0.8125rem' }}>{b.borrow_date}</td>
                  <td className="text-mono" style={{ fontSize: '0.8125rem' }}>{b.return_plan_date}</td>
                  <td><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
