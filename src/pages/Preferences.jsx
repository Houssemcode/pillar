import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

export default function Preferences() {
  const { gender, isExcused, setIsExcused } = useUser();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleToggleExcuse = () => {
    if (isExcused) {
      // If currently true, trying to set to false -> show confirmation
      setShowConfirmModal(true);
    } else {
      // If currently false, trying to set to true -> just set it
      setIsExcused(true);
    }
  };

  const confirmEndExcuse = () => {
    setIsExcused(false);
    setShowConfirmModal(false);
  };

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', color: 'var(--color-text)' }}>الإعدادات (Preferences)</h1>

      {gender === 'female' && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>العذر الشرعي (Menstruation Excuse)</h3>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: '400px' }}>
              تفعيل هذا الخيار سيقوم بإيقاف مؤقت لحساب الصلوات والصيام، ولن يؤثر على سلسلة التزامك (Streak).
            </p>
          </div>
          
          <button 
            onClick={handleToggleExcuse}
            style={{
              background: isExcused ? 'var(--color-primary)' : 'var(--color-surface-hover)',
              border: 'none',
              borderRadius: '20px',
              width: '60px',
              height: '32px',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.3s ease'
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              background: 'white',
              borderRadius: '50%',
              position: 'absolute',
              top: '4px',
              left: isExcused ? '32px' : '4px',
              transition: 'left 0.3s ease'
            }} />
          </button>
        </div>
      )}

      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>إعدادات الحساب</h3>
        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
          الجنس الحالي: <strong>{gender === 'female' ? 'أنثى' : 'ذكر'}</strong>
        </p>
      </div>

      {showConfirmModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, color: 'var(--color-text)' }}>تأكيد إنهاء العذر</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
              هل أنتِ متأكدة من إيقاف وضع العذر الشرعي؟ سيتم استئناف تتبع الصلاة والصيام.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn" 
                style={{ flex: 1, padding: '0.8rem', background: 'var(--color-surface-hover)', color: 'var(--color-text)', border: 'none', borderRadius: '8px' }}
                onClick={() => setShowConfirmModal(false)}
              >
                إلغاء
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '0.8rem', borderRadius: '8px' }}
                onClick={confirmEndExcuse}
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
