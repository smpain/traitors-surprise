import { useEffect } from 'react';
import Head from 'next/head';

export default function Clear() {
  useEffect(() => {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('traitors_player');
      console.log('Cleared localStorage - player selection reset');
      
      // Redirect to main page after a brief delay
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  }, []);

  return (
    <>
      <Head>
        <title>Resetting Player Selection...</title>
      </Head>
      <div id="container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div>
          <h1 style={{ color: 'var(--gold)', fontFamily: 'Cinzel, serif' }}>
            Resetting Player Selection...
          </h1>
          <p style={{ color: 'var(--text)', marginTop: '16px' }}>
            Redirecting to choose your identity...
          </p>
        </div>
      </div>
    </>
  );
}
