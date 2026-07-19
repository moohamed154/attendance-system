import { cache } from 'react';

export const getRequestId = cache(() => {
  return 'req_' + Math.random().toString(36).substring(2, 15);
});
