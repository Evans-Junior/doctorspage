import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { useAuthStore } from '../store/auth';
import { Search } from 'lucide-react';

interface Patient {
  user_name: string;
  id: string;
  uid: string;
  email: string;
  age: number;
  status: string;
  connectedSince: string;
  imageUrl: string;
  occupation: string;
  address: string;
  country: string;
  bio: string;
  goal: string;
}

const PatientList = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { doctor } = useAuthStore();
  const doctorUid = doctor?.uid;
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAcceptedPatients = async () => {
      try {
        if (!doctorUid) throw new Error('Doctor not authenticated');

        const q = query(
          collection(db, 'notifications'),
          where('doctorUid', '==', doctorUid),
          where('status', '==', 'accepted')
        );

        const querySnapshot = await getDocs(q);
        const fetchedPatients = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const notificationData = docSnap.data();
            const userDoc = await getDoc(doc(db, 'users', notificationData.userUid));
            
            if (!userDoc.exists()) return null;

            const userData = userDoc.data();
            return {
              id: docSnap.id,
              uid: userData.uid,
              user_name: userData.user_name || 'Unknown',
              email: userData.email,
              age: userData.age || 0,
              address: userData.address || 'Not specified',
              country: userData.country || 'Not specified',
              bio: userData.bio || 'No bio available',
              goal: userData.goal || 'No goals specified',
              phone_number: userData.phone_number,
              image_link: userData.image_link,
              occupation: userData.occupation,
              connectedSince: notificationData.timestamp?.toDate().toLocaleDateString() || 'N/A'
            };
          })
        );

        const validPatients = fetchedPatients.filter(Boolean) as unknown as Patient[];
        setPatients(validPatients);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAcceptedPatients();
  }, [doctorUid]);

  const filteredPatients = patients.filter(patient => 
    patient.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <p>Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold text-teal-600">My Patients</h1>
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:text-sm"
          />
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No patients found. Accept connection requests to see patients here.</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No patients match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <div key={patient.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4">
                <div className="flex items-center space-x-4 mb-4">
                  {patient.imageUrl && (
                    <img 
                      src={patient.imageUrl} 
                      alt={patient.user_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{patient.user_name}</h3>
                    <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {patient.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Age:</span> {patient.age}
                  </div>
                  <div>
                    <span className="font-medium">Occupation:</span> {patient.occupation}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {patient.address}, {patient.country}
                  </div>
                  <div>
                    <span className="font-medium">Connected since:</span> {patient.connectedSince}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium mb-1">Health Goals:</h4>
                  <p className="text-sm text-gray-600">{patient.goal}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium mb-1">Bio:</h4>
                  <p className="text-sm text-gray-600">{patient.bio}</p>
                </div>

                <div className="mt-4">
                  <Link
                    to={`/patients/${patient.uid}`}
                    className="block w-full text-center bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
                  >
                    View Full Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientList;