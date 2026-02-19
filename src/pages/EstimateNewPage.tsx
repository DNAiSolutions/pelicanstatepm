import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

import {
  getWorkOrderById,
  getQuotesByWorkOrderId,
  getSiteById,
  getProjectById,
  getCampusById,
  type Quote,
} from '../data/pipeline';

import { QuoteEditor } from '../components/QuoteEditor';

export function EstimateNewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workOrderId, setWorkOrderId] = useState<string | null>(null);
  const [existingQuote, setExistingQuote] = useState<Quote | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      console.error('[EstimateNewPage] No work order ID in URL params');
      toast.error('No work order ID provided');
      navigate('/work-requests');
      return;
    }

    console.log('[EstimateNewPage] Loading work order:', id);
    const wo = getWorkOrderById(id);
    if (!wo) {
      console.error('[EstimateNewPage] Work order not found for ID:', id);
      toast.error('Work order not found');
      navigate('/work-requests');
      return;
    }

    console.log('[EstimateNewPage] Work order loaded successfully:', wo.requestNumber);
    setWorkOrderId(id);
    const quotes = getQuotesByWorkOrderId(id);
    setExistingQuote(quotes.sort((a, b) => b.version - a.version)[0]);
    setIsLoading(false);
  }, [id, navigate]);

  const workOrder = workOrderId ? getWorkOrderById(workOrderId) : undefined;
  const site = workOrder ? getSiteById(workOrder.siteId) : null;
  const campus = site ? getCampusById(site.campusId) : null;
  const project = workOrder ? getProjectById(workOrder.projectId) : null;

  const handleSaveQuote = async () => {
    toast.success('Quote saved (mock)');
  };

  const handleSubmitQuote = async () => {
    toast.success('Quote submitted for approval (mock)');
    if (workOrderId) {
      navigate(`/work-requests/${workOrderId}`);
    }
  };

  const headerInfo = useMemo(() => {
    if (!workOrder) return null;
    return {
      title: workOrder.title,
      requestNumber: workOrder.requestNumber,
      siteName: site?.name,
      campusName: campus?.name,
      projectName: project?.name,
    };
  }, [workOrder, site?.name, campus?.name, project?.name]);

   if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 text-[#143352] animate-spin" />
      </div>
    );
  }

  if (!workOrder || !workOrderId || !headerInfo) {
    console.error('[EstimateNewPage] Missing data:', { workOrder, workOrderId, headerInfo, id });
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <h2 className="text-lg font-bold text-red-800 mb-2">Unable to Load Quote Builder</h2>
          <p className="text-red-700 mb-4">
            There was a problem loading the work order details. This might be due to:
          </p>
          <ul className="list-disc list-inside text-red-700 mb-4 space-y-1">
            <li>The work order no longer exists</li>
            <li>Invalid work order ID in the URL</li>
            <li>Data loading error</li>
          </ul>
          <button
            onClick={() => navigate('/work-requests')}
            className="btn-primary"
          >
            Back to Work Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => navigate(`/work-requests/${workOrderId}`)}
        className="flex items-center gap-2 text-[#143352] hover:text-[#143352]/80"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Work Order
      </button>

      <div className="bg-white border border-neutral-200 p-6">
        <p className="text-sm text-neutral-500">
          {headerInfo.campusName} • {headerInfo.siteName}
        </p>
        <h1 className="text-3xl font-heading font-bold text-neutral-900 mt-2">
          Quote Builder
        </h1>
        <p className="text-neutral-600 mt-1">
          {headerInfo.requestNumber} — {headerInfo.title}
        </p>
        {headerInfo.projectName && (
          <p className="text-sm text-neutral-500 mt-1">Project: {headerInfo.projectName}</p>
        )}
      </div>

      <QuoteEditor
        workOrderId={workOrderId}
        existingQuote={existingQuote}
        onSave={handleSaveQuote}
        onSubmit={handleSubmitQuote}
        onCancel={() => navigate(`/work-requests/${workOrderId}`)}
      />
    </div>
  );
}
