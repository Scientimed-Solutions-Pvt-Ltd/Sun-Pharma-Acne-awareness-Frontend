import React, { useState } from 'react';

interface LoginFormProps {
  onLogin?: (employeeCode: string) => void;
  isLoading?: boolean;
  error?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isLoading, error }) => {
  const [employeeCode, setEmployeeCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin && employeeCode) {
      onLogin(employeeCode);
    }
  };

  return (
    <div className="rounded-2xl p-6 md:p-8 shadow-lg max-w-md formbg">
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label 
            htmlFor="employeeCode" 
            className="block text-lg font-semibold text-gray-800 mb-2 text-left"
          >
            Employee code
          </label>
          {error && (
            <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <input
            type="text"
            className="w-full border-none rounded-xl py-1 px-4 text-lg bg-white focus:outline-none focus:shadow-lg focus:shadow-primary/30 transition-shadow"
            id="employeeCode"
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
            placeholder=""
            required
            disabled={isLoading}
          />
        </div>
        <div className="text-center mt-6">
          <button 
            type="submit" 
            className="prplbtn1 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
