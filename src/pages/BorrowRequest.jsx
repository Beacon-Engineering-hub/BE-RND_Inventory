import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import { ClipboardText, CheckCircle } from '@phosphor-icons/react';

export default function BorrowRequest() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ borrower_name: '', division: '', purpose: '', borrow_date: '', return_plan_date: '' });
  const [selectedItems, setSelectedItems] = useState({});
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const toast = useToast();

  useEffect(() => { api.items.list({ status: 'available' }).then(r => setItems(r.data)).catch(() => {}); }, []);

  const toggleItem = (id) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = 1;
      return next;
    });
  };

  const updateQuantity = (id, qty, max) => {
    let q = parseInt(qty) || 1;
    if (q > max) q = max;
    if (q < 1) q = 1;
    setSelectedItems(prev => ({ ...prev, [id]: q }));
  };

  const filtered = items.filter(i => i.item_name.toLowerCase().includes(search.toLowerCase()) || i.item_code.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const itemPayload = Object.entries(selectedItems).map(([id, qty]) => ({ id: Number(id), quantity: qty }));
    if (!itemPayload.length) { toast('Pilih minimal satu barang', 'error'); return; }
    setSaving(true);
    try {
      await api.borrow.create({ ...form, items: itemPayload });
      setSuccess(true);
    } catch (err) { toast(err.message, 'error'); }
    setSaving(false);
  };

  if (success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: 400, padding: '3rem 2rem' }}>
          <CheckCircle size={56} weight="duotone" color="var(--color-accent)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Pengajuan Terkirim</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Pengajuan peminjaman Anda sedang menunggu approval dari Tim RND.</p>
          <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => { setSuccess(false); setForm({ borrower_name: '', division: '', purpose: '', borrow_date: '', return_plan_date: '' }); setSelectedItems({}); }}>
            Ajukan Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>Ajukan Peminjaman</h2><p>Form pengajuan peminjaman barang RND oleh divisi lain</p></div>
      </div>

      <div className="bento-grid dashboard">
        <div className="card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 650, marginBottom: '1.25rem' }}>Data Peminjam</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Nama Peminjam</label><input className="form-input" required value={form.borrower_name} onChange={e => setForm(f => ({ ...f, borrower_name: e.target.value }))} placeholder="Nama lengkap" /></div>
                <div className="form-group"><label className="form-label">Divisi</label><input className="form-input" required value={form.division} onChange={e => setForm(f => ({ ...f, division: e.target.value }))} placeholder="Divisi / Departemen" /></div>
              </div>
              <div className="form-group"><label className="form-label">Keperluan</label><textarea className="form-textarea" required value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="Jelaskan keperluan peminjaman" rows={3} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Tanggal Pinjam</label><input className="form-input" type="date" required min={new Date().toISOString().split('T')[0]} value={form.borrow_date} onChange={e => setForm(f => ({ ...f, borrow_date: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Rencana Kembali</label><input className="form-input" type="date" required min={form.borrow_date || new Date().toISOString().split('T')[0]} value={form.return_plan_date} onChange={e => setForm(f => ({ ...f, return_plan_date: e.target.value }))} /></div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center' }} disabled={saving}>
              <ClipboardText size={16} /> {saving ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 650, marginBottom: '0.75rem' }}>Pilih Barang</h3>
          <input className="form-input" placeholder="Cari barang..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: '0.75rem' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 380, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem' }}><p>Tidak ada barang tersedia</p></div>
            ) : filtered.map(item => {
              const isSelected = !!selectedItems[item.id];
              return (
                <div key={item.id} className={`checkbox-item${isSelected ? ' selected' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem' }}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleItem(item.id)} />
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => toggleItem(item.id)}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.item_name}</div>
                    <div className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.item_code} - Stok: {item.quantity}</div>
                  </div>
                  {isSelected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Qty:</span>
                      <input 
                        type="number" 
                        min="1" 
                        max={item.quantity} 
                        value={selectedItems[item.id]} 
                        onChange={(e) => updateQuantity(item.id, e.target.value, item.quantity)}
                        style={{ width: 60, padding: '0.25rem', border: '1px solid var(--color-border)', borderRadius: 4, textAlign: 'center' }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {Object.keys(selectedItems).length > 0 && (
            <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--color-accent-soft)', borderRadius: 'var(--radius-input)', fontSize: '0.8125rem', color: 'var(--color-accent)', fontWeight: 600 }}>
              {Object.keys(selectedItems).length} barang dipilih
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
