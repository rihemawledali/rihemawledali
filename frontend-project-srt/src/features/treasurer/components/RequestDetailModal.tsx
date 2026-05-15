/* ============================================
   Treasurer — Generic detail modal for a request
   Used by Prêts and Indemnités pages.
   ============================================ */

import type { ReactNode } from 'react';
import {
  FileText, Download, Check, X, Hash, User, Calendar,
} from 'lucide-react';
import { Modal } from '../../../shared/data/Modal';
import { Button } from '../../../shared/ui/Button';
import { StatusBadge } from '../../../shared/data/StatusBadge';
import { formatDate } from '../../../shared/lib/formatters';

export interface RequestDetailField {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  full?: boolean;
}

interface RequestDetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  reference: string;
  adherentNom: string;
  dateDemande: string;
  statut: string;
  statutLabel?: string;
  fields: RequestDetailField[];
  motif?: string;
  documentNom?: string;
  documentSize?: number;
  /** Show validate / reject buttons (only for en_attente). */
  canDecide?: boolean;
  onValidate?: () => void;
  onReject?: () => void;
}

export function RequestDetailModal({
  open, onClose, title,
  reference, adherentNom, dateDemande, statut, statutLabel,
  fields, motif, documentNom, documentSize,
  canDecide, onValidate, onReject,
}: RequestDetailModalProps) {
  const handleDownload = () => {
    if (!documentNom) return;
    // Mock download — fake a click on a data URL.
    const blob = new Blob(
      [`Document factice — ${documentNom}\nRéférence : ${reference}\nGénéré le ${new Date().toISOString()}\n`],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = documentNom;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={`Référence ${reference.toUpperCase()}`}
      size="md"
      footer={(
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
          {canDecide && (
            <>
              <Button variant="danger" onClick={onReject}>
                <X size={14} style={{ marginRight: 6 }} />
                Rejeter
              </Button>
              <Button variant="primary" onClick={onValidate}>
                <Check size={14} style={{ marginRight: 6 }} />
                Valider
              </Button>
            </>
          )}
        </div>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* ---- Header summary ---- */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-3)',
            padding: 'var(--space-3)',
            background: 'var(--color-surface-secondary)',
            border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <DetailField icon={<Hash size={14} />} label="Référence" value={<span style={{ fontFamily: 'var(--font-family-mono, monospace)' }}>{reference.toUpperCase()}</span>} />
          <DetailField icon={<User size={14} />} label="Adhérent" value={<strong>{adherentNom}</strong>} />
          <DetailField icon={<Calendar size={14} />} label="Date de demande" value={formatDate(dateDemande)} />
          <DetailField label="Statut" value={<StatusBadge status={statut} label={statutLabel} />} />
        </div>

        {/* ---- Type-specific fields ---- */}
        {fields.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {fields.map((f, i) => (
              <div key={i} style={f.full ? { gridColumn: '1 / -1' } : undefined}>
                <DetailField icon={f.icon} label={f.label} value={f.value} />
              </div>
            ))}
          </div>
        )}

        {/* ---- Motif ---- */}
        {motif && (
          <section>
            <h4
              style={{
                margin: '0 0 6px',
                fontSize: 'var(--font-size-xs)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--color-text-tertiary)',
                fontWeight: 600,
              }}
            >
              Motif / Justification
            </h4>
            <p
              style={{
                margin: 0,
                padding: 'var(--space-3)',
                background: 'var(--color-surface-secondary)',
                borderLeft: '3px solid var(--color-primary-300)',
                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                fontSize: 'var(--font-size-sm)',
                lineHeight: 1.5,
                color: 'var(--color-text-primary)',
              }}
            >
              {motif}
            </p>
          </section>
        )}

        {/* ---- Document ---- */}
        <section>
          <h4
            style={{
              margin: '0 0 6px',
              fontSize: 'var(--font-size-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--color-text-tertiary)',
              fontWeight: 600,
            }}
          >
            Justificatif
          </h4>
          {documentNom ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: 'var(--color-primary-50)',
                border: '1px solid var(--color-primary-100)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  width: 40, height: 40,
                  borderRadius: 8,
                  background: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary-700)',
                  flexShrink: 0,
                }}
              >
                <FileText size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>
                  {documentNom}
                </strong>
                {documentSize != null && (
                  <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                    {(documentSize / 1024).toFixed(1)} Ko
                  </span>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                <Download size={14} style={{ marginRight: 6 }} />
                Télécharger
              </Button>
            </div>
          ) : (
            <p
              style={{
                margin: 0,
                padding: '12px 14px',
                background: 'var(--color-surface-secondary)',
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-tertiary)',
                fontStyle: 'italic',
              }}
            >
              Aucun justificatif joint à cette demande.
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
}

function DetailField({
  icon, label, value,
}: { icon?: ReactNode; label: string; value: ReactNode }) {
  return (
    <div>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 'var(--font-size-xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: 'var(--color-text-tertiary)',
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {icon}
        {label}
      </span>
      <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>
        {value}
      </div>
    </div>
  );
}
