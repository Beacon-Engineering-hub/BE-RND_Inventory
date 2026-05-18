import { useState } from 'react';
import { api } from '../lib/api';
import { LockKey, Eye, EyeSlash } from '@phosphor-icons/react';

export default function PasswordModal({ onSuccess, onCancel, title }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.auth.verify(password);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-input)', background: 'var(--color-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LockKey size={20} weight="duotone" color="var(--color-accent)" />
          </div>
          <div>
            <h3 className="modal-title" style={{ marginBottom: 0 }}>Password RND</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{title || 'Masukkan password untuk melanjutkan'}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type={show ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password RND"
                autoFocus
              />
              <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                {show ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <span className="form-error">{error}</span>}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onCancel}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !password}>
              {loading ? 'Memverifikasi...' : 'Konfirmasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
