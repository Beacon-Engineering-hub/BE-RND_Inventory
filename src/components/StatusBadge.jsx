export const STATUS_MAP = {
  available: { label: 'Tersedia', class: 'badge-available' },
  out: { label: 'Keluar', class: 'badge-out' },
  borrowed: { label: 'Dipinjam', class: 'badge-borrowed' },
  damaged: { label: 'Rusak', class: 'badge-damaged' },
  lost: { label: 'Hilang', class: 'badge-lost' },
  pending: { label: 'Menunggu', class: 'badge-pending' },
  approved: { label: 'Disetujui', class: 'badge-approved' },
  rejected: { label: 'Ditolak', class: 'badge-rejected' },
  returned: { label: 'Dikembalikan', class: 'badge-returned' },
};

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, class: '' };
  return (
    <span className={`badge ${s.class}`}>
      <span className="badge-dot" />
      {s.label}
    </span>
  );
}
