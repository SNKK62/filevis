import React from 'react';
import { Button } from './ui/button';

type Props = { path: string; onJump: (p: string) => void };
export default function Breadcrumbs({ path, onJump }: Props) {
  const parts = path.split('/').filter(Boolean);
  const acc: string[] = [];
  return (
    <div className="text-sm px-3 py-2 border-b">
      <Button variant="link" onClick={() => onJump('/')}>/</Button>
      {parts.map((p, i) => {
        acc.push(p);
        const joined = '/' + acc.join('/');
        return (
          <span key={i}>
            {' / '}
            <Button variant="link" onClick={() => onJump(joined)}>{p}</Button>
          </span>
        );
      })}
    </div>
  );
}
