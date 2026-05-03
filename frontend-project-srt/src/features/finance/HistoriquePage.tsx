import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable, type Column } from '../../components/data/DataTable';
import { Pagination } from '../../components/data/Pagination';
import { SearchInput } from '../../components/data/SearchInput';
import { FilterBar, SelectFilter } from '../../components/data/FilterBar';
import { StatusBadge } from '../../components/data/StatusBadge';
import { historiqueApi } from './financeApi';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import type { HistoriqueFinanciere } from '../../types/domain';
import '../../components/layout/CrudPage.css';

const TYPE_LABEL: Record<string, string> = {
  credit: 'Crédit', debit: 'Débit', pret: 'Prêt',
  remboursement: 'Remboursement', cotisation: 'Cotisation',
  indemnite: 'Indemnité', facture: 'Facture',
  entree: 'Entrée', sortie: 'Sortie',
};

export function HistoriquePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const query = useQuery({
    queryKey: ['historique', { page, search, type, sortBy, sortDir }],
    queryFn: () => historiqueApi.list({ page, size: 15, search, sortBy, sortDir, filters: { type } }),
  });

  const onSort = (k: string) => sortBy === k ? setSortDir(sortDir === 'asc' ? 'desc' : 'asc') : (setSortBy(k), setSortDir('asc'));

  const columns: Column<HistoriqueFinanciere>[] = useMemo(() => [
    { key: 'date', header: 'Date', sortable: true, cell: (h) => <span className="cell-muted">{formatDateTime(h.date)}</span> },
    { key: 'reference', header: 'Référence', cell: (h) => <span className="cell-mono">{h.reference}</span> },
    { key: 'description', header: 'Opération', sortable: true, cell: (h) => (
      <div className="row-stack">
        <strong className="cell-strong">{h.description}</strong>
        {h.utilisateur && <span>par {h.utilisateur}</span>}
      </div>
    )},
    { key: 'type', header: 'Type', sortable: true, cell: (h) => <StatusBadge tone="neutral" status={h.type} label={TYPE_LABEL[h.type]} /> },
    { key: 'montant', header: 'Montant', sortable: true, align: 'right', cell: (h) => {
      const positive = h.montant >= 0;
      return (
        <span className={`amount ${positive ? 'amount--positive' : 'amount--negative'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {positive ? '+' : '−'}{formatCurrency(Math.abs(h.montant))}
        </span>
      );
    }},
  ], []);

  return (
    <div>
      <PageHeader
        title="Historique financier"
        description="Journal complet des opérations financières du système"
        breadcrumb={['Administration', 'Finance', 'Historique']}
      />

      <div className="crud-toolbar">
        <FilterBar>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Référence, description, utilisateur..." />
          <SelectFilter label="Type" value={type} onChange={(v) => { setType(v); setPage(1); }}
            options={Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        rowKey={(h) => h.id}
        sortBy={sortBy} sortDir={sortDir} onSortChange={onSort}
        emptyTitle="Aucune opération"
      />

      {query.data && query.data.total > 0 && (
        <div className="data-table-card" style={{ marginTop: 'var(--space-3)' }}>
          <Pagination page={page} size={15} total={query.data.total} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
