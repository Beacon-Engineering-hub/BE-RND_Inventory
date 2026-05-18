import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import PasswordModal from '../components/PasswordModal';
import { useToast } from '../components/Toast';
import { Handshake, CheckCircle, XCircle, Eye } from '@phosphor-icons/react';

export default function BorrowApproval() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null); // { type: 'approve'|'reject'|'return', id, data }
  const [showPwd, setShowPwd] = useState(false);
  const [detail, setDetail] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const toast = useToast();

  const load = () => {
    api.borrow.list().then(r => { setRequests(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async () => {
    try {
      if (action.type === 'approve') {
        await api.borrow.approve(action.id);
        toast('Pengajuan disetujui');
      } else if (action.type === 'reject') {
        await api.borrow.reject(action.id, { reason: rejectReason });
        toast('Pengajuan ditolak');
      } else if (action.type === 'return') {
        await api.borrow.return(action.id, {});
        toast('Barang dikembalikan');
      }
      load();
    } catch (err) { toast(err.message, 'error'); }
    setAction(null); setRejectReason('');
  };

  const showDetail = async (id) => {
    try {
      const r = await api.borrow.get(id);
      setDetail(r.data);
    } catch (err) { toast(err.message, 'error'); }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const active = requests.filter(r => r.status === 'approved' || r.status === 'borrowed');
  const processed = requests.filter(r => !['pending', 'approved', 'borrowed'].includes(r.status));

  return (
    <div>
      <div className="page-header">
        <div><h2>Approval Peminjaman</h2><p>Kelola pengajuan peminjaman barang RND</p></div>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-warning)', marginBottom: '0.75rem' }}>Menunggu Approval ({pending.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pending.map(req => (
              <div key={req.id} className="card card-compact">
                <div className="flex-between">
                  <div>
                    <div style={{ fontWeight: 600 }}>{req.borrower_name} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize: '0.8125rem' }}>- {req.division}</span></div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{req.purpose}</div>
                    <div className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{req.borrow_date} s/d {req.return_plan_date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => showDetail(req.id)}><Eye size={14} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => { setAction({ type: 'reject', id: req.id }); setShowPwd(true); }}><XCircle size={14} /> Tolak</button>
                    <button className="btn btn-primary btn-sm" onClick={() => { setAction({ type: 'approve', id: req.id }); setShowPwd(true); }}><CheckCircle size={14} /> Setujui</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active borrows */}
      {active.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-info)', marginBottom: '0.75rem' }}>Sedang Dipinjam ({active.length})</h3>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead><tr><th>No. Surat</th><th>Peminjam</th><th>Divisi</th><th>Tgl Kembali</th><th>Aksi</th></tr></thead>
              <tbody>
                {active.map(req => (
                  <tr key={req.id}>
                    <td className="code">{req.borrow_number || '-'}</td>
                    <td style={{ fontWeight: 550 }}>{req.borrower_name}</td>
                    <td>{req.division}</td>
                    <td className="text-mono" style={{ fontSize: '0.8125rem' }}>{req.return_plan_date}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => showDetail(req.id)}><Eye size={14} /></button>
                        <button className="btn btn-outline btn-sm" onClick={() => { setAction({ type: 'return', id: req.id }); setShowPwd(true); }}>Kembalikan</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && <div style={{ padding: '2rem' }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 64, marginBottom: 8 }} />)}</div>}
      {!loading && pending.length === 0 && active.length === 0 && (
        <div className="card"><div className="empty-state"><Handshake size={48} /><h3>Tidak ada pengajuan</h3><p>Semua pengajuan sudah diproses</p></div></div>
      )}

      {showPwd && (
        <PasswordModal
          title={action?.type === 'approve' ? 'Setujui peminjaman' : action?.type === 'reject' ? 'Tolak peminjaman' : 'Konfirmasi pengembalian'}
          onCancel={() => { setShowPwd(false); setAction(null); }}
          onSuccess={() => {
            setShowPwd(false);
            if (action?.type === 'reject') {
              // Show reject reason input
              const reason = prompt('Alasan penolakan (opsional):');
              setRejectReason(reason || '');
            }
            handleAction();
          }}
        />
      )}

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-panel wide" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Detail Pengajuan</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Peminjam</div><div style={{ fontWeight: 550 }}>{detail.borrower_name}</div></div>
              <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Divisi</div><div>{detail.division}</div></div>
              <div style={{ gridColumn: '1 / -1' }}><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Keperluan</div><div>{detail.purpose}</div></div>
              <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Tgl Pinjam</div><div className="text-mono">{detail.borrow_date}</div></div>
              <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Rencana Kembali</div><div className="text-mono">{detail.return_plan_date}</div></div>
            </div>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, marginTop: '1.25rem', marginBottom: '0.5rem' }}>Barang yang Dipinjam</h4>
            {detail.items?.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                <span>{i.item_name} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>(Qty: {i.quantity})</span></span>
                <span className="code">{i.item_code}</span>
              </div>
            ))}
            <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
              <div>
                {(detail.status === 'approved' || detail.status === 'borrowed') && (
                  <button className="btn btn-outline" onClick={async () => {
                    try {
                      const res = await api.borrow.print(detail.id);
                      toast(res.message);
                    } catch (e) { toast(e.message, 'error'); }
                  }}>Cetak Surat (Manual)</button>
                )}
              </div>
              <button className="btn btn-outline" onClick={() => setDetail(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
