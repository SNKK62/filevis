import React from 'react';

type Props = { path: string; onJump: (p: string) => void };
export default function Breadcrumbs({ path, onJump }: Props) {
  const parts = path.split('/').filter(Boolean);
  const acc: string[] = [];
  return (
    <div className="text-sm px-3 py-2 border-b">
      <button className="underline" onClick={() => onJump('/')}>/</button>
      {parts.map((p, i) => {
        acc.push(p);
        const joined = '/' + acc.join('/');
        return (
          <span key={i}>
            {' / '}
            <button className="underline" onClick={() => onJump(joined)}>{p}</button>
          </span>
        );
      })}
    </div>
  );
}

