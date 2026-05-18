import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import PasswordModal from '../components/PasswordModal';
import { useToast } from '../components/Toast';
import { ArrowLeft, PencilSimple, Cube, Tag, CalendarBlank } from '@phosphor-icons/react';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    api.items.get(id).then(r => { setItem(r.data); setLoading(false); }).catch(() => { setLoading(false); navigate('/items'); });
  }, [id]);

  if (loading) return <div style={{ padding: '2rem' }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 24, marginBottom: 12, width: i === 1 ? '40%' : '70%' }} />)}</div>;
  if (!item) return null;

  const parseDriveLink = (url) => {
    if (!url) return null;
    const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const idMatch = url.match(/[\?&]id=([a-zA-Z0-9_-]+)/);
    const id = (dMatch && dMatch[1]) || (idMatch && idMatch[1]);
    if (id) {
      return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
    }
    return url;
  };

  const displayImageUrl = parseDriveLink(item.image_url);

  return (
    <div>
      <Link to="/items" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--color-text-secondary)', textDecoration: 'none', marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Kembali ke Data Barang
      </Link>

      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2>{item.item_name}</h2>
            <StatusBadge status={item.status} />
          </div>
          <p className="text-mono" style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.9375rem', marginTop: '0.25rem' }}>{item.item_code}</p>
        </div>
        <button className="btn btn-outline" onClick={() => setShowPwd(true)}>
          <PencilSimple size={16} /> Edit
        </button>
      </div>

      <div className="bento-grid dashboard">
        <div className="card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 650, marginBottom: '1.25rem' }}>Informasi Barang</h3>
          
          {displayImageUrl && (
            <div style={{ marginBottom: '1.25rem' }}>
              <img src={displayImageUrl} alt={item.item_name} style={{ width: '100%', maxWidth: 300, height: 'auto', borderRadius: 'var(--radius-input)', objectFit: 'cover', border: '1px solid var(--color-border)' }} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <InfoRow icon={Tag} label="Kategori" value={item.category} />
            <InfoRow icon={Cube} label="Tipe" value={item.item_type === 'box' ? 'Set/Kotak' : 'Satuan'} />
            <InfoRow label="Jumlah" value={item.quantity} mono />
            <InfoRow label="Status" value={<StatusBadge status={item.status} />} />
            <InfoRow icon={CalendarBlank} label="Dibuat" value={item.created_at?.split('T')[0] || item.created_at} />
            {item.updated_at && <InfoRow label="Diperbarui" value={item.updated_at?.split('T')[0] || item.updated_at} />}
          </div>
          {item.notes && (
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-input)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {item.notes}
            </div>
          )}
        </div>

        {item.item_type === 'box' && item.contents && (
          <div className="card">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 650, marginBottom: '1rem' }}>Isi Kotak/Set</h3>
            {item.contents.length === 0 ? (
              <div className="empty-state"><p>Belum ada isi</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {item.contents.map((c, i) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: i < item.contents.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{c.content_name}</span>
                      {c.content_note && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>{c.content_note}</span>}
                    </div>
                    <span className="text-mono" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>x{c.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showPwd && <PasswordModal title="Edit barang" onCancel={() => setShowPwd(false)} onSuccess={() => { setShowPwd(false); setEditing(true); }} />}
      {editing && <EditItemModal item={item} onClose={() => { setEditing(false); api.items.get(id).then(r => setItem(r.data)); }} toast={toast} />}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: 4 }}>
        {Icon && <Icon size={12} />} {label}
      </div>
      <div style={{ fontSize: '0.9375rem', fontWeight: 500, ...(mono ? { fontFamily: 'var(--font-mono)' } : {}) }}>
        {value}
      </div>
    </div>
  );
}

function EditItemModal({ item, onClose, toast }) {
  const [form, setForm] = useState({ item_name: item.item_name, category: item.category, item_type: item.item_type, quantity: item.quantity, notes: item.notes || '', status: item.status, image_url: item.image_url || '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.items.update(item.id, form);
      toast('Barang berhasil diperbarui');
      onClose();
    } catch (err) { toast(err.message, 'error'); }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel wide" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Edit Barang</h3>
        <p className="modal-desc">Kode: <span className="text-mono" style={{ color: 'var(--color-accent)' }}>{item.item_code}</span></p>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Nama Barang</label><input className="form-input" required value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Kategori</label><input className="form-input" required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Jumlah</label><input className="form-input" type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} /></div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="available">Tersedia</option><option value="out">Keluar</option><option value="borrowed">Dipinjam</option><option value="damaged">Rusak</option><option value="lost">Hilang</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Link Foto Barang (Google Drive)</label>
              <input className="form-input" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://drive.google.com/file/d/..." />
            </div>
            <div className="form-group"><label className="form-label">Catatan</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
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
