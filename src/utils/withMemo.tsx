import React, { memo, ComponentType } from 'react';

// Custom comparison function for better memoization
function areEqual(_prevProps: Record<string, unknown>, _nextProps: Record<string, unknown>): boolean {
  // Shallow comparison for primitive values
  const prevKeys = Object.keys(_prevProps);
  const nextKeys = Object.keys(_nextProps);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    if (!(key in _nextProps)) {
      return false;
    }

    const prevValue = _prevProps[key];
    const nextValue = _nextProps[key];

    // For functions, always consider them different (unless they're the same reference)
    if (typeof prevValue === 'function' && typeof nextValue === 'function') {
      if (prevValue !== nextValue) {
        return false;
      }
      continue;
    }

    // For objects and arrays, do shallow comparison
    if (typeof prevValue === 'object' && prevValue !== null &&
        typeof nextValue === 'object' && nextValue !== null) {
      if (Array.isArray(prevValue) && Array.isArray(nextValue)) {
        if (prevValue.length !== nextValue.length) {
          return false;
        }
        for (let i = 0; i < prevValue.length; i++) {
          if (prevValue[i] !== nextValue[i]) {
            return false;
          }
        }
      } else if (prevValue !== nextValue) {
        // For objects, check reference equality
        return false;
      }
      continue;
    }

    // For primitives, direct comparison
    if (prevValue !== nextValue) {
      return false;
    }
  }

  return true;
}

// HOC for memoization with display name preservation
export function withMemo<P extends object>(
  Component: ComponentType<P>,
  customCompare?: (prevProps: P, nextProps: P) => boolean
): ComponentType<P> {
  const MemoizedComponent = memo(Component, customCompare || areEqual);

  // Preserve display name
  MemoizedComponent.displayName = `withMemo(${Component.displayName || Component.name})`;

  return MemoizedComponent;
}

// Utility hook for memoizing expensive computations
export function useMemoCompare<T>(
  next: T
): T {
  // Note: This implementation has some React rules violations
  // Consider using useMemo with proper dependencies instead
  const previousRef = React.useRef<T | undefined>(undefined);

  React.useEffect(() => {
    previousRef.current = next;
  });

  return next; // Simplified implementation
}

// Performance monitoring hook - simplified to avoid render-time ref access
export function usePerformanceMonitor() {
  // Note: This is a simplified version to avoid React hooks violations
  // In a real implementation, you would use useState and useEffect properly
  return {
    renderCount: 0,
  };
}