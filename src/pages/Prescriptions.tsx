import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Prescription } from '../types';
import { FileText, Filter } from 'lucide-react';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const prescriptionsRef = collection(db, 'prescriptions');
        const q = query(prescriptionsRef, orderBy('createdAt', 'desc'));
        const prescriptionsSnap = await getDocs(q);
        
        const prescriptionsData = prescriptionsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Prescription[];

        setPrescriptions(prescriptionsData);
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  const filteredPrescriptions = filter === 'all' 
    ? prescriptions 
    : prescriptions.filter(p => p.category === filter);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <p>Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-teal-600">Prescriptions</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-teal-600" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200"
            >
              <option value="all">All Categories</option>
              <option value="COPD">COPD</option>
              <option value="Smokers">Smokers</option>
              <option value="Control">Control</option>
              <option value="Air">Air</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medication</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPrescriptions.map((prescription) => (
                <tr key={prescription.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{prescription.patientName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${prescription.category === 'COPD' ? 'bg-red-100 text-red-800' :
                        prescription.category === 'Smokers' ? 'bg-yellow-100 text-yellow-800' :
                        prescription.category === 'Control' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'}`}>
                      {prescription.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {prescription.medication}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs overflow-hidden text-ellipsis">
                      {prescription.instructions}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {prescription.doctorName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {prescription.createdAt.toDate().toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${prescription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {prescription.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Prescriptions;