import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function ManageAppointment() {
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    
    setLoading(true);
    setError('');
    setMessage('');
    
    const functions = getFunctions();
    const cancelAppointment = httpsCallable(functions, 'cancelAppointment');
    
    try {
      await cancelAppointment({ appointmentId, token });
      setMessage('Your appointment has been successfully cancelled.');
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Manage Appointment</h1>
        
        {message ? (
          <div className="text-green-600 font-medium text-lg bg-green-50 p-4 rounded-xl">{message}</div>
        ) : (
          <>
            <p className="text-gray-600 mb-8">
              Need to cancel your upcoming pet grooming appointment? Note that cancellations must be made at least 24 hours in advance.
            </p>
            
            {error && <p className="text-red-500 mb-4 font-medium">{error}</p>}
            
            <button 
              onClick={handleCancel}
              disabled={loading || !token}
              className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Cancelling...' : 'Cancel Appointment'}
            </button>
            
            {!token && (
              <p className="text-sm text-red-500 mt-4">Security token is missing from the URL.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
