import type { ReactNode } from 'react';

type Props = {
  title?: string;
  children: ReactNode;
};

export function AppLayout({ title = '總覽', children }: Props) {
  return (
    <div style={{ minHeight: '100dvh', background: '#f6f4ef', color: '#1c1c1e' }}>
      <header style={{ padding: '20px 16px 8px', borderBottom: '1px solid #e8e5de' }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>{title}</h1>
      </header>
      <main style={{ padding: 16 }}>{children}</main>
    </div>
  );
}
