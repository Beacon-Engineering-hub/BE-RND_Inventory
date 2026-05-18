import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import PasswordModal from '../components/PasswordModal';
import { useToast } from '../components/Toast';
import { GearSix, Printer, LockKey, FloppyDisk } from '@phosphor-icons/react';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [showPwd, setShowPwd] = useState(null); // 'settings' | 'password'
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const toast = useToast();

  useEffect(() => {
    api.settings.get().then(r => { setSettings(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.settings.update(settings);
      toast('Pengaturan disimpan');
    } catch (err) { toast(err.message, 'error'); }
    setSaving(false);
  };

  const handleTestPrint = async () => {
    setPrinting(true);
    try {
      const res = await api.settings.testPrint();
      toast(res.message);
    } catch (err) { toast(err.message, 'error'); }
    setPrinting(false);
  };

  const handleChangePassword = async () => {
    if (pwdForm.new_password !== pwdForm.confirm) { toast('Konfirmasi password tidak cocok', 'error'); return; }
    try {
      await api.auth.changePassword({ current_password: pwdForm.current_password, new_password: pwdForm.new_password });
      toast('Password berhasil diubah');
      setPwdForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) { toast(err.message, 'error'); }
  };

  if (loading) return <div style={{ padding: '2rem' }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 12 }} />)}</div>;

  return (
    <div>
      <div className="page-header"><div><h2>Pengaturan</h2><p>Konfigurasi printer dan keamanan</p></div></div>

      <div className="bento-grid dashboard">
        {/* Printer Settings */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-input)', background: 'var(--color-info-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Printer size={20} weight="duotone" color="var(--color-info)" />
            </div>
            <div><h3 style={{ fontSize: '1rem', fontWeight: 650 }}>Pengaturan Printer</h3><p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Konfigurasi IP printer untuk cetak surat</p></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Nama Printer</label><input className="form-input" value={settings.printer_name || ''} onChange={e => setSettings(s => ({ ...s, printer_name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">IP Printer</label><input className="form-input text-mono" value={settings.printer_ip || ''} onChange={e => setSettings(s => ({ ...s, printer_ip: e.target.value }))} placeholder="192.168.1.50" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Port</label><input className="form-input text-mono" value={settings.printer_port || ''} onChange={e => setSettings(s => ({ ...s, printer_port: e.target.value }))} placeholder="9100" /></div>
              <div className="form-group">
                <label className="form-label">Mode Print</label>
                <select className="form-select" value={settings.print_mode || 'manual'} onChange={e => setSettings(s => ({ ...s, print_mode: e.target.value }))}>
                  <option value="manual">Manual (Klik Tombol Print)</option>
                  <option value="auto">Auto Print (IP Printer)</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Prefix Nomor Surat</label><input className="form-input text-mono" value={settings.letter_number_prefix || ''} onChange={e => setSettings(s => ({ ...s, letter_number_prefix: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button className="btn btn-primary" onClick={() => setShowPwd('settings')}>
              <FloppyDisk size={16} /> Simpan Pengaturan
            </button>
            <button className="btn btn-outline" onClick={handleTestPrint} disabled={printing}>
              <Printer size={16} /> {printing ? 'Mencetak...' : 'Test Print'}
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-input)', background: 'var(--color-warning-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LockKey size={20} weight="duotone" color="var(--color-warning)" />
            </div>
            <div><h3 style={{ fontSize: '1rem', fontWeight: 650 }}>Password RND</h3><p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Ubah password aksi tim RND</p></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group"><label className="form-label">Password Lama</label><input className="form-input" type="password" value={pwdForm.current_password} onChange={e => setPwdForm(p => ({ ...p, current_password: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Password Baru</label><input className="form-input" type="password" value={pwdForm.new_password} onChange={e => setPwdForm(p => ({ ...p, new_password: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Konfirmasi Password</label><input className="form-input" type="password" value={pwdForm.confirm} onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))} /></div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={handleChangePassword} disabled={!pwdForm.current_password || !pwdForm.new_password}>
            <LockKey size={16} /> Ubah Password
          </button>
        </div>
      </div>

      {showPwd === 'settings' && <PasswordModal title="Simpan pengaturan" onCancel={() => setShowPwd(null)} onSuccess={() => { setShowPwd(null); handleSaveSettings(); }} />}
    </div>
  );
}
