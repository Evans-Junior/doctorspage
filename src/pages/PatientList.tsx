
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { useAuthStore } from '../store/auth';
import { FiSearch, FiUser, FiPhone, FiMail, FiMapPin, FiCalendar } from 'react-icons/fi';

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
  const doctorUid = doctor?.uid; // Replace with actual doctor UID
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
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
        setFilteredPatients(validPatients);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAcceptedPatients();
  }, [doctorUid]);


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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Patients</h1>
        <Link 
          to="/notifications" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          View Connection Requests
        </Link>
      </div>

      {patients.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No patients found. Accept connection requests to see patients here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => (
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
                    {/* <p className="text-sm text-gray-500">{patient.email}</p> */}
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
                    className="block w-full text-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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