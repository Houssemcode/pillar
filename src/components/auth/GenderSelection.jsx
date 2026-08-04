import React from 'react';
import { useUser } from '../../context/UserContext';

export default function GenderSelection() {
  const { setGender } = useUser();

  const handleSelect = (selectedGender) => {
    setGender(selectedGender);
  };

  return (
    <div className="gender-selection-overlay" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--color-text)' }}>مرحباً بك في بيلار</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: 1.5 }}>
          لتخصيص تجربتك بشكل أفضل وتقديم المحتوى المناسب، يرجى تحديد الجنس. هذا الخيار نهائي ولا يمكن تغييره لاحقاً.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <button 
            className="btn btn-primary" 
            style={{ padding: '1rem', fontSize: '1.1rem', borderRadius: '12px' }}
            onClick={() => handleSelect('male')}
          >
            ذكر (Male)
          </button>
          
          <button 
            className="btn btn-primary" 
            style={{ padding: '1rem', fontSize: '1.1rem', borderRadius: '12px', backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}
            onClick={() => handleSelect('female')}
          >
            أنثى (Female)
          </button>
        </div>
      </div>
    </div>
  );
}
