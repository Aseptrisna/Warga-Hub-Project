import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { citizensService } from '../../services/citizens.service';
import { useRegionScope } from '../../hooks/useRegionScope';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';

export default function CitizensPage() {
  const scope = useRegionScope();
  const [citizens, setCitizens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>({});

  useEffect(() => {
    loadCitizens();
  }, [page, search]);

  const loadCitizens = async () => {
    try {
      setLoading(true);
      const response = await citizensService.getAll({ page, limit: 10, search, ...scope });
      setCitizens(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Error loading citizens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus data warga ini?')) return;

    try {
      await citizensService.delete(id);
      loadCitizens();
    } catch (error) {
      alert('Gagal menghapus data');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Warga</h1>
          <p className="text-gray-600 mt-1">Kelola data warga dan keluarga</p>
        </div>
        <Link
          to="/citizens/new"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tambah Warga
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari NIK, nama, atau No KK..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : citizens.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Tidak ada data</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIK</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">JK</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RT/RW</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pekerjaan</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {citizens.map((citizen) => (
                    <tr key={citizen.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{citizen.nik}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{citizen.namaLengkap}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{citizen.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{citizen.rt}/{citizen.rw}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{citizen.pekerjaan || '-'}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/citizens/${citizen.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/citizens/${citizen.id}/edit`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(citizen.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((meta.page - 1) * meta.limit) + 1} - {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === meta.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
