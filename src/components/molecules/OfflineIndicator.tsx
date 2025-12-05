import React from 'react';
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

interface OfflineIndicatorProps {
  showMessage?: boolean;
  className?: string;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showMessage = true,
  className = ''
}) => {
  const { isOnline, isOffline, wasOffline } = useOfflineStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <div className={`flex items-center space-x-2 px-4 py-2 text-sm ${className} ${
      isOffline
        ? 'bg-red-50 text-red-800 border border-red-200'
        : 'bg-green-50 text-green-800 border border-green-200'
    }`}>
      {isOffline ? (
        <>
          <ExclamationTriangleIcon className="h-4 w-4" />
          {showMessage && (
            <span>오프라인 모드 - 일부 기능이 제한됩니다</span>
          )}
        </>
      ) : (
        <>
          <WifiIcon className="h-4 w-4" />
          {showMessage && wasOffline && (
            <span>온라인으로 복구되었습니다</span>
          )}
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;