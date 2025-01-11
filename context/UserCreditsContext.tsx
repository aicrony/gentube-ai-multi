import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserCreditsContextProps {
  userCreditsResponse: number | null;
  setUserCreditsResponse: (credits: number | null) => void;
}

const UserCreditsContext = createContext<UserCreditsContextProps | undefined>(
  undefined
);

export const UserCreditsProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [userCreditsResponse, setUserCreditsResponse] = useState<number | null>(
    null
  );

  return (
    <UserCreditsContext.Provider
      value={{ userCreditsResponse, setUserCreditsResponse }}
    >
      {children}
    </UserCreditsContext.Provider>
  );
};

export const useUserCredits = (): UserCreditsContextProps => {
  const context = useContext(UserCreditsContext);
  if (!context) {
    throw new Error('useUserCredits must be used within a UserCreditsProvider');
  }
  return context;
};
