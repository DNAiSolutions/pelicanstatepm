import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
export interface ProjectDetailHeaderProps {
  project: any;
  onGoBack?: () => void;
}

export function ProjectDetailHeader({ project, onGoBack }: ProjectDetailHeaderProps) {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      navigate('/projects');
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <button
          onClick={handleGoBack}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </button>
        <div>
          <h1 className="text-3xl font-heading font-semibold text-neutral-900">
            {project.name}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Project ID: {project.id}
          </p>
        </div>
      </div>
      <button
        className="flex items-center gap-2 px-4 py-2 text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
        aria-label="Share project"
      >
        <Share2 className="w-4 h-4" />
        <span className="text-sm font-medium">Share</span>
      </button>
    </div>
  );
}
