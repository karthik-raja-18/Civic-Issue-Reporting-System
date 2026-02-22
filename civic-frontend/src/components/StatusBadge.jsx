import { STATUS_META } from '../utils/helpers'

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, css: 'badge' }
  return <span className={meta.css}>{meta.label}</span>
}
