import { useState, useRef } from 'react';
import { Upload, Trash2, CheckCircle, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { pdfService } from '../services/pdfService';

export interface HistoricDoc {
  photos: Array<{ url: string; type: 'before' | 'during' | 'after'; notes: string }>;
  materials_log: Array<{ product: string; spec: string; supplier: string; fasteners: string; quantity: number }>;
  method_notes: string;
  architect_guidance: string;
  compliance_notes: string;
}

interface HistoricDocumentationProps {
  onSave: (doc: HistoricDoc) => Promise<void>;
  initialData?: HistoricDoc;
  isLoading?: boolean;
  workRequestNumber?: string;
  propertyName?: string;
}

export function HistoricDocumentation({
  onSave,
  initialData,
  isLoading = false,
  workRequestNumber = 'WR-2024-001',
  propertyName = 'Unknown Property',
}: HistoricDocumentationProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const [doc, setDoc] = useState<HistoricDoc>(
    initialData || {
      photos: [],
      materials_log: [],
      method_notes: '',
      architect_guidance: '',
      compliance_notes: '',
    }
  );

  // Handle photo upload
  const handlePhotoUpload = async (type: 'before' | 'during' | 'after') => {
    fileInputRef.current?.click();
    fileInputRef.current?.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // In a real app, upload to Supabase Storage
          const url = URL.createObjectURL(file);
          setDoc((prev) => ({
            ...prev,
            photos: [...prev.photos, { url, type, notes: '' }],
          }));
          toast.success(`${type} photo added`);
        } catch (error) {
          toast.error('Failed to upload photo');
        }
      }
    });
  };

  // Remove photo
  const removePhoto = (index: number) => {
    setDoc((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  // Update photo notes
  const updatePhotoNotes = (index: number, notes: string) => {
    setDoc((prev) => {
      const updated = [...prev.photos];
      updated[index] = { ...updated[index], notes };
      return { ...prev, photos: updated };
    });
  };

  // Add material
  const addMaterial = () => {
    setDoc((prev) => ({
      ...prev,
      materials_log: [...prev.materials_log, { product: '', spec: '', supplier: '', fasteners: '', quantity: 0 }],
    }));
  };

  // Update material
  const updateMaterial = (index: number, field: keyof (typeof doc.materials_log)[0], value: any) => {
    setDoc((prev) => {
      const updated = [...prev.materials_log];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, materials_log: updated };
    });
  };

  // Remove material
  const removeMaterial = (index: number) => {
    setDoc((prev) => ({
      ...prev,
      materials_log: prev.materials_log.filter((_, i) => i !== index),
    }));
  };

  // Save
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(doc);
      toast.success('Historic documentation saved');
    } catch (error) {
      toast.error('Failed to save documentation');
    } finally {
      setIsSaving(false);
    }
  };

  // Download PDF Report
  const handleDownloadPDF = async () => {
    try {
      setIsDownloadingPDF(true);
      await pdfService.generateHistoricReportPDF(
        {
          request_number: workRequestNumber,
          property: propertyName,
          materials_log: doc.materials_log,
          method_notes: doc.method_notes,
          architect_guidance: doc.architect_guidance,
          compliance_notes: doc.compliance_notes,
        },
        `Historic-Report-${workRequestNumber}.pdf`
      );
      toast.success('Historic report PDF downloaded');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate historic report PDF');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Photos Section */}
      <div className="card p-8">
        <h3 className="text-2xl font-heading font-bold text-neutral-900 mb-6">
          Project Photos
        </h3>

        {/* Photo Tabs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {(['before', 'during', 'after'] as const).map((type) => (
            <div key={type}>
              <button
                type="button"
                onClick={() => handlePhotoUpload(type)}
                className="w-full btn-secondary py-3 px-4 flex items-center justify-center gap-2 capitalize"
              >
                <Upload className="w-4 h-4" />
                Add {type} Photo
              </button>
            </div>
          ))}
        </div>

        {/* Photo Grid */}
        {doc.photos.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <p>No photos uploaded yet. Upload before, during, and after photos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {doc.photos.map((photo, index) => (
              <div key={index} className="border border-neutral-200 p-4 space-y-3">
                <img
                  src={photo.url}
                  alt={`${photo.type} photo`}
                  className="w-full h-40 object-cover bg-neutral-100"
                />
                <div>
                  <p className="text-sm font-medium text-neutral-900 mb-1 capitalize">
                    {photo.type} Photo
                  </p>
                  <textarea
                    value={photo.notes}
                    onChange={(e) => updatePhotoNotes(index, e.target.value)}
                    placeholder="Add notes about this photo..."
                    rows={2}
                    className="w-full px-2 py-1 text-sm border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="w-full btn-secondary py-2 px-3 text-red-600 hover:bg-red-50 text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* Materials Log */}
      <div className="card p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-heading font-bold text-neutral-900">
            Materials Log
          </h3>
          <button
            type="button"
            onClick={addMaterial}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Add Material
          </button>
        </div>

        {doc.materials_log.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <p>No materials logged yet. Add materials used in this project.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-neutral-300">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">Spec</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">Supplier</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-900">Fasteners</th>
                  <th className="text-right py-3 px-4 font-medium text-neutral-900">Qty</th>
                  <th className="text-center py-3 px-4 font-medium text-neutral-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {doc.materials_log.map((material, index) => (
                  <tr key={index}>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={material.product}
                        onChange={(e) => updateMaterial(index, 'product', e.target.value)}
                        placeholder="e.g., Paint, Wood, Steel"
                        className="w-full px-2 py-1 text-sm border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={material.spec}
                        onChange={(e) => updateMaterial(index, 'spec', e.target.value)}
                        placeholder="e.g., Eggshell, Grade A"
                        className="w-full px-2 py-1 text-sm border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={material.supplier}
                        onChange={(e) => updateMaterial(index, 'supplier', e.target.value)}
                        placeholder="Supplier name"
                        className="w-full px-2 py-1 text-sm border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={material.fasteners}
                        onChange={(e) => updateMaterial(index, 'fasteners', e.target.value)}
                        placeholder="e.g., Stainless steel nails"
                        className="w-full px-2 py-1 text-sm border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={material.quantity}
                        onChange={(e) => updateMaterial(index, 'quantity', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-2 py-1 text-sm border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => removeMaterial(index)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Method Notes */}
      <div className="card p-8">
        <label htmlFor="method_notes" className="block text-sm font-medium text-neutral-900 mb-2">
          Method Notes
        </label>
        <textarea
          id="method_notes"
          value={doc.method_notes}
          onChange={(e) => setDoc({ ...doc, method_notes: e.target.value })}
          placeholder="Describe the methods and techniques used in this project..."
          rows={4}
          className="w-full px-4 py-2 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Architect Guidance */}
      <div className="card p-8">
        <label htmlFor="architect_guidance" className="block text-sm font-medium text-neutral-900 mb-2">
          Architect Guidance
        </label>
        <textarea
          id="architect_guidance"
          value={doc.architect_guidance}
          onChange={(e) => setDoc({ ...doc, architect_guidance: e.target.value })}
          placeholder="Document architect requirements and guidance followed..."
          rows={4}
          className="w-full px-4 py-2 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Compliance Notes */}
      <div className="card p-8">
        <label htmlFor="compliance_notes" className="block text-sm font-medium text-neutral-900 mb-2">
          Compliance & Historic Guidelines
        </label>
        <textarea
          id="compliance_notes"
          value={doc.compliance_notes}
          onChange={(e) => setDoc({ ...doc, compliance_notes: e.target.value })}
          placeholder="Note compliance with historic preservation guidelines and any special considerations..."
          rows={4}
          className="w-full px-4 py-2 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

       {/* Save Button */}
       <div className="flex gap-3">
         <button
           type="button"
           onClick={handleSave}
           disabled={isSaving || isLoading}
           className="flex-1 btn-primary py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
         >
           {isSaving ? (
             <>
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
               Saving...
             </>
           ) : (
             <>
               <CheckCircle className="w-5 h-5" />
               Save Documentation
             </>
           )}
         </button>

         <button
           type="button"
           onClick={handleDownloadPDF}
           disabled={isDownloadingPDF}
           className="btn-secondary py-3 px-6 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
         >
           {isDownloadingPDF ? (
             <>
               <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
               Downloading...
             </>
           ) : (
             <>
               <Download className="w-5 h-5" />
               Download PDF Report
             </>
           )}
         </button>
       </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 text-sm text-blue-700 space-y-2">
        <p className="font-medium flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Historic Documentation Requirements
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Upload before, during, and after photos</li>
          <li>Document all materials used, including suppliers and specs</li>
          <li>Provide details on methods and techniques</li>
          <li>Include architect guidance and requirements followed</li>
          <li>Note any special compliance considerations</li>
        </ul>
      </div>
    </div>
  );
}
