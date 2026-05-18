import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import PasswordModal from '../components/PasswordModal';
import { useToast } from '../components/Toast';
import { SignOut, MagnifyingGlass } from '@phosphor-icons/react';

export default function Outgoing() {
  const [history, setHistory] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();

  const load = () => {
    Promise.all([api.outgoing.list(), api.items.list({ status: 'available' })]).then(([h, i]) => {
      setHistory(h.data); setItems(i.data); setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="page-header">
        <div><h2>Barang Keluar</h2><p>Catat barang yang keluar dari ruang RND</p></div>
        <button className="btn btn-primary" onClick={() => setShowPwd(true)}><SignOut size={16} /> Input Barang Keluar</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem' }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 4 }} />)}</div>
        ) : history.length === 0 ? (
          <div className="empty-state"><SignOut size={48} /><h3>Belum ada riwayat</h3><p>Belum ada barang yang dicatat keluar</p></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Kode</th><th>Nama Barang</th><th>PIC</th><th>Alasan</th><th>Tanggal</th></tr></thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td className="code">{h.item_code}</td>
                  <td style={{ fontWeight: 550 }}>{h.item_name}</td>
                  <td>{h.person_in_charge}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>{h.reason || h.description || '-'}</td>
                  <td className="text-mono" style={{ fontSize: '0.8125rem' }}>{h.out_date?.split(' ')[0] || h.out_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showPwd && <PasswordModal title="Input barang keluar" onCancel={() => setShowPwd(false)} onSuccess={() => { setShowPwd(false); setShowForm(true); }} />}
      {showForm && <OutgoingForm items={items} onClose={() => { setShowForm(false); load(); }} toast={toast} />}
    </div>
  );
}

function OutgoingForm({ items, onClose, toast }) {
  const [form, setForm] = useState({ item_id: '', person_in_charge: '', reason: '', description: '' });
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = items.filter(i => i.item_name.toLowerCase().includes(search.toLowerCase()) || i.item_code.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_id) { toast('Pilih barang terlebih dahulu', 'error'); return; }
    setSaving(true);
    try {
      await api.outgoing.create({ ...form, item_id: parseInt(form.item_id) });
      toast('Barang keluar berhasil dicatat');
      onClose();
    } catch (err) { toast(err.message, 'error'); }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel wide" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Input Barang Keluar</h3>
        <p className="modal-desc">Pilih barang dan isi data penanggung jawab</p>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Pilih Barang</label>
              <input className="form-input" placeholder="Cari barang..." value={search} onChange={e => setSearch(e.target.value)} />
              <div style={{ maxHeight: 160, overflowY: 'auto', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {filtered.map(item => (
                  <div key={item.id} className={`checkbox-item${form.item_id == item.id ? ' selected' : ''}`} onClick={() => setForm(f => ({ ...f, item_id: item.id }))}>
                    <span className="code" style={{ fontSize: '0.8125rem' }}>{item.item_code}</span>
                    <span style={{ fontSize: '0.875rem' }}>{item.item_name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Penanggung Jawab</label>
              <input className="form-input" required value={form.person_in_charge} onChange={e => setForm(f => ({ ...f, person_in_charge: e.target.value }))} placeholder="Nama PIC" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Alasan</label>
                <select className="form-select" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}>
                  <option value="">Pilih alasan</option>
                  <option value="Dipakai project">Dipakai project</option>
                  <option value="Dipindahkan">Dipindahkan</option>
                  <option value="Diberikan">Diberikan ke divisi lain</option>
                  <option value="Rusak">Rusak</option>
                  <option value="Hilang">Hilang</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Keterangan</label>
                <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detail opsional" />
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
