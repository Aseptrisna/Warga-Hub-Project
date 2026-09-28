import { useEffect, useState } from 'react';
import { Plus, FileText, Edit, Trash2, ToggleLeft, ToggleRight, Eye, X } from 'lucide-react';
import { letterTemplatesService, LetterTemplate } from '../../services/letters.service';

const LetterTemplatesPage = () => {
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await letterTemplatesService.getAll();
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await letterTemplatesService.toggleActive(id);
      loadTemplates();
    } catch (error: any) {
      console.error('Failed to toggle template:', error);
      alert(error.response?.data?.message || 'Gagal mengubah status template');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus template "${name}"?`)) return;

    try {
      await letterTemplatesService.delete(id);
      alert('Template berhasil dihapus');
      loadTemplates();
    } catch (error: any) {
      console.error('Failed to delete template:', error);
      alert(error.response?.data?.message || 'Gagal menghapus template');
    }
  };

  const handlePreview = (template: LetterTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Template Surat</h1>
            <p className="text-sm text-gray-600 mt-1">
              Kelola template surat untuk berbagai jenis dokumen
            </p>
          </div>
          <button
            onClick={() => alert('Fitur tambah template akan segera hadir')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Template
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada template</h3>
          <p className="text-sm text-gray-600">Tambahkan template surat pertama Anda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {template.isActive ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">Kode: {template.code}</p>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>
              </div>

              {/* Required Fields */}
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Field yang diperlukan:</p>
                <div className="flex flex-wrap gap-1">
                  {template.requiredFields.slice(0, 5).map((field) => (
                    <span
                      key={field}
                      className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
                    >
                      {field}
                    </span>
                  ))}
                  {template.requiredFields.length > 5 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      +{template.requiredFields.length - 5} lagi
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handlePreview(template)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
                <button
                  onClick={() => alert('Fitur edit akan segera hadir')}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  title="Edit"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleToggleActive(template.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  title={template.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {template.isActive ? (
                    <ToggleRight className="w-4 h-4" />
                  ) : (
                    <ToggleLeft className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(template.id, template.name)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors ml-auto"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Kode: {selectedTemplate.code}</p>
                </div>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setSelectedTemplate(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Required Fields:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.requiredFields.map((field) => (
                    <span
                      key={field}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">HTML Template:</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {selectedTemplate.content}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LetterTemplatesPage;
