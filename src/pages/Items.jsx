import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import PasswordModal from '../components/PasswordModal';
import { useToast } from '../components/Toast';
import { Plus, MagnifyingGlass, Package, Cube, Trash, PencilSimple } from '@phosphor-icons/react';

export default function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showPwd, setShowPwd] = useState(null); // 'add' | 'delete-{id}' | null
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const loadItems = () => {
    const params = {};
    if (search) params.search = search;
    if (catFilter) params.category = catFilter;
    if (statusFilter) params.status = statusFilter;
    api.items.list(params).then(r => { setItems(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { loadItems(); }, [search, catFilter, statusFilter]);
  useEffect(() => { api.items.categories().then(r => setCategories(r.data)).catch(() => {}); }, []);

  const handleDelete = async (id) => {
    try {
      await api.items.delete(id);
      toast('Barang berhasil dihapus');
      loadItems();
    } catch (err) { toast(err.message, 'error'); }
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Data Barang</h2><p>Kelola semua barang inventaris RND</p></div>
        <button className="btn btn-primary" onClick={() => setShowPwd('add')}>
          <Plus size={16} weight="bold" /> Tambah Barang
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <MagnifyingGlass size={16} />
          <input className="form-input" placeholder="Cari nama atau kode barang..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
        </div>
        <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">Semua Kategori</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="available">Tersedia</option>
          <option value="out">Keluar</option>
          <option value="borrowed">Dipinjam</option>
          <option value="damaged">Rusak</option>
          <option value="lost">Hilang</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem' }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 4 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <h3>Tidak ada barang</h3>
            <p>{search || catFilter || statusFilter ? 'Coba ubah filter pencarian' : 'Klik tombol Tambah Barang untuk memulai'}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>Foto</th>
                <th>Nama Barang</th>
                <th>Kategori</th>
                <th>Tipe</th>
                <th>Qty</th>
                <th>Status</th>
                <th style={{ width: 100 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                let imgUrl = null;
                if (item.image_url) {
                  const match = item.image_url.match(new RegExp('/d/(.+?)/')) || item.image_url.match(new RegExp('\\\\?id=(.+?)(&|$)'));
                  imgUrl = match ? `https://lh3.googleusercontent.com/d/${match[1] || match[2]}` : item.image_url;
                }
                return (
                  <tr key={item.id}>
                    <td>
                      {imgUrl ? (
                        <img src={imgUrl} alt="Foto" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={18} color="var(--color-text-muted)" /></div>
                      )}
                    </td>
                    <td style={{ fontWeight: 550 }}>
                      <Link to={`/items/${item.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {item.item_name}
                      </Link>
                    </td>
                  <td>{item.category}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      {item.item_type === 'box' ? <Cube size={14} /> : null}
                      {item.item_type === 'box' ? 'Set/Kotak' : 'Satuan'}
                    </span>
                  </td>
                  <td className="text-mono" style={{ fontSize: '0.8125rem' }}>{item.quantity}</td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <Link to={`/items/${item.id}`} className="btn btn-outline btn-sm btn-icon"><PencilSimple size={14} /></Link>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => { setDeleteTarget(item); setShowPwd('delete'); }}>
                        <Trash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Password Modal for Add */}
      {showPwd === 'add' && (
        <PasswordModal title="Tambah barang baru" onCancel={() => setShowPwd(null)} onSuccess={() => { setShowPwd(null); setShowAdd(true); }} />
      )}

      {/* Password Modal for Delete */}
      {showPwd === 'delete' && deleteTarget && (
        <PasswordModal title={`Hapus ${deleteTarget.item_code}`} onCancel={() => { setShowPwd(null); setDeleteTarget(null); }} onSuccess={() => { setShowPwd(null); handleDelete(deleteTarget.id); }} />
      )}

      {/* Add Modal */}
      {showAdd && <AddItemModal onClose={() => { setShowAdd(false); loadItems(); }} toast={toast} />}
    </div>
  );
}

function AddItemModal({ onClose, toast }) {
  const [form, setForm] = useState({ item_name: '', category: '', item_type: 'single', quantity: 1, notes: '', contents: [], image_url: '' });
  const [newContent, setNewContent] = useState({ content_name: '', quantity: 1, content_note: '' });
  const [nextCode, setNextCode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.items.nextCode().then(r => setNextCode(r.data)).catch(() => {}); }, []);

  const addContent = () => {
    if (!newContent.content_name) return;
    setForm(f => ({ ...f, contents: [...f.contents, { ...newContent }] }));
    setNewContent({ content_name: '', quantity: 1, content_note: '' });
  };

  const removeContent = (idx) => {
    setForm(f => ({ ...f, contents: f.contents.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.items.create(form);
      toast('Barang berhasil ditambahkan');
      onClose();
    } catch (err) { toast(err.message, 'error'); }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel wide" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Tambah Barang Baru</h3>
        <p className="modal-desc">Kode barang: <span className="text-mono" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{nextCode}</span></p>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nama Barang</label>
                <input className="form-input" required value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} placeholder="Multimeter Digital" />
              </div>
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <input className="form-input" required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Alat Ukur" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Jenis Barang</label>
                <select className="form-select" value={form.item_type} onChange={e => setForm(f => ({ ...f, item_type: e.target.value }))}>
                  <option value="single">Barang Satuan</option>
                  <option value="box">Barang Set/Kotak</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Jumlah</label>
                <input className="form-input" type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Link Foto Barang (Google Drive dsb.)</label>
              <input className="form-input" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://drive.google.com/file/d/..." />
            </div>
            <div className="form-group">
              <label className="form-label">Catatan</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Catatan opsional..." rows={2} />
            </div>

            {form.item_type === 'box' && (
              <div>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Isi Kotak/Set</label>
                {form.contents.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ flex: 1, fontSize: '0.875rem' }}>{c.content_name}</span>
                    <span className="text-mono" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>x{c.quantity}</span>
                    <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeContent(i)}><Trash size={12} /></button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input className="form-input" placeholder="Nama isi" value={newContent.content_name} onChange={e => setNewContent(c => ({ ...c, content_name: e.target.value }))} style={{ flex: 1 }} />
                  <input className="form-input" type="number" min="1" value={newContent.quantity} onChange={e => setNewContent(c => ({ ...c, quantity: parseInt(e.target.value) || 1 }))} style={{ width: 70 }} />
                  <button type="button" className="btn btn-outline btn-sm" onClick={addContent}>Tambah</button>
                </div>
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Barang'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
