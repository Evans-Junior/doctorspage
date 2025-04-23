//patientsdetails.tsx
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { X } from 'lucide-react';

interface Props {
  userUid: string;
  onClose: () => void;
}

const PatientDetailsPopup: React.FC<Props> = ({ userUid, onClose }) => {
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = async () => {
    const snapshot = await getDocs(collection(db, 'results', userUid, 'history'));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setHistory(data);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-center items-center">
      <div className="bg-white w-[90%] max-w-3xl p-6 rounded-xl shadow-lg overflow-y-auto max-h-[90%]">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-xl font-semibold">Patient History</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {history.length === 0 ? (
          <p className="text-gray-500">No history available.</p>
        ) : (
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div key={index} className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Date:</strong> {entry.timestamp?.toDate().toLocaleString()}
                </p>
                <p className="text-sm text-gray-700 mb-1">
                  <strong>Health Advice:</strong> {entry.healthAdvice}
                </p>
                <div className="text-xs text-gray-600 mt-2">
                  <strong>Sensor Readings:</strong>
                  <ul className="list-disc pl-5">
                    {Object.entries(entry.originalSensorInput || {}).map(([key, value]) => (
                      <li key={key}>
                        {key}: {String(value)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetailsPopup;
