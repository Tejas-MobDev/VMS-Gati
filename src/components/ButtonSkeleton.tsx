import React from 'react';
import { Skeleton } from './Skeleton';

type ButtonSkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
};

export function ButtonSkeleton({
  width = 72,
  height = 16,
}: ButtonSkeletonProps) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={4}
      style={{ backgroundColor: 'rgba(255,255,255,0.45)' }}
    />
  );
}
