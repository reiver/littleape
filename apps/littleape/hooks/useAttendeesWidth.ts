'use client'

import { useMemo } from 'react';

export const useAttendeesWidth = ({
  isAttendeesOpen,
  isMoreOptionsOpen,
  deviceSize,
}: {
  isAttendeesOpen: boolean;
  isMoreOptionsOpen: boolean;
  deviceSize: string;
}) => {
  return useMemo(() => {
    if (isAttendeesOpen || isMoreOptionsOpen) {
      return deviceSize === 'xs' ? 0 : 350 + 40;
    }
    return 0;
  }, [isAttendeesOpen, isMoreOptionsOpen, deviceSize]);
};