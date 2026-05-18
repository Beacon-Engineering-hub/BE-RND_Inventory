import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import { ClockCounterClockwise } from '@phosphor-icons/react';

export default function BorrowHistory() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.borrow.list().then(r => { setRequests(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header"><div><h2>Riwayat Peminjaman</h2><p>Semua riwayat pengajuan peminjaman barang RND</p></div></div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem' }}>{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 4 }} />)}</div>
        ) : requests.length === 0 ? (
          <div className="empty-state"><ClockCounterClockwise size={48} /><h3>Belum ada riwayat</h3><p>Belum ada pengajuan peminjaman</p></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>No. Surat</th><th>Peminjam</th><th>Divisi</th><th>Keperluan</th><th>Tgl Pinjam</th><th>Status</th></tr></thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td className="code">{r.borrow_number || '-'}</td>
                  <td style={{ fontWeight: 550 }}>{r.borrower_name}</td>
                  <td>{r.division}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>{r.purpose}</td>
                  <td className="text-mono" style={{ fontSize: '0.8125rem' }}>{r.borrow_date}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
