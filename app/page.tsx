'use client';

import { useEffect, useRef } from 'react';
import FightingGame from './components/FightingGame';

export default function Home() {
  return (
    <main style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <FightingGame />
    </main>
  );
}
