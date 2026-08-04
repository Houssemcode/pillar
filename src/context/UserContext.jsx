import React, { createContext, useContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [gender, setGender] = useState(() => localStorage.getItem('pillar_gender'));
  const [isExcused, setIsExcused] = useState(() => localStorage.getItem('pillar_isExcused') === 'true');

  useEffect(() => {
    if (gender) {
      localStorage.setItem('pillar_gender', gender);
    } else {
      localStorage.removeItem('pillar_gender');
    }
  }, [gender]);

  useEffect(() => {
    localStorage.setItem('pillar_isExcused', isExcused.toString());
  }, [isExcused]);

  return (
    <UserContext.Provider value={{ gender, setGender, isExcused, setIsExcused }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
