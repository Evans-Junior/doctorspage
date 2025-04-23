import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  getDoc
} from 'firebase/firestore';

interface Notification {
  id: string;
  doctorName: string;
  userUid: string;
  status: string;
  timestamp: any;
}

interface PatientDetails {
  user_name: string | null;
  age: number;
  country: string;
  address: string | null;
  occupation: string | null;
  image_link: string | null;
  bio: string | null;
  goal: string | null;
}

interface NotificationsProps {
  onClose: () => void;
  doctorUid: string;
}

const Notifications: React.FC<NotificationsProps> = ({ onClose, doctorUid }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async (doctorUid: string) => {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('doctorUid', '==', doctorUid),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      const allPending: Notification[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Notification[];

      setNotifications(allPending);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleAccept = async (notif: Notification) => {
    try {
      // First verify the notification belongs to this doctor
      const notificationRef = doc(db, 'notifications', notif.id);
      const notificationSnap = await getDoc(notificationRef);
      
      if (!notificationSnap.exists() || notificationSnap.data()?.doctorUid !== doctorUid) {
        throw new Error("You can only accept requests sent to you");
      }
  
      // Perform the update
      await updateDoc(notificationRef, {
        status: 'accepted'
      });
      
      setNotifications(notifications.filter((n) => n.id !== notif.id));
      navigate('/patients');
    } catch (error) {
      console.error('Error accepting request:', error);
      alert("Failed to accept request: " + error.message);
    }
  };
  
  const handleReject = async (notif: Notification) => {
    try {
      // First verify the notification belongs to this doctor
      const notificationRef = doc(db, 'notifications', notif.id);
      const notificationSnap = await getDoc(notificationRef);
      
      if (!notificationSnap.exists() || notificationSnap.data()?.doctorUid !== doctorUid) {
        throw new Error("You can only reject requests sent to you");
      }
  
      // Perform the update
      await updateDoc(notificationRef, {
        status: 'rejected'
      });
      
      setNotifications(notifications.filter((n) => n.id !== notif.id));
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert("Failed to reject request: " + error.message);
    }
  };


  // const fetchPatientDetails = async (userUid: string) => {
  //   setLoading(true);
  //   try {
  //     const docRef = doc(db, 'users', userUid);
  //     const docSnap = await getDoc(docRef);
      
  //     if (docSnap.exists()) {
  //       const data = docSnap.data();
  //       const patientDetails: PatientDetails = {
  //         user_name: data.user_name || 'Not provided',
  //         age: data.age || 0,
  //         country: data.country || 'Not provided',
  //         address: data.address || 'Not provided',
  //         occupation: data.occupation || 'Not provided',
  //         image_link: data.image_link,
  //         bio: data.bio || 'No bio available',
  //         goal: data.goal || 'No goal specified'
  //       };
  //       setSelectedPatient(patientDetails);
  //       setShowPopup(true);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching patient details:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    fetchNotifications(doctorUid);
  }, [doctorUid]);

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-lg z-50 overflow-y-auto">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Connection Requests</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close notifications"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No pending requests</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div key={notif.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="mb-3">
                  <h3 className="font-medium text-gray-800">
                    {notif.userName || 'New Patient'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Requested {notif.timestamp?.toDate().toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleAccept(notif)}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(notif)}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm transition-colors"
                  >
                    Reject
                  </button>
                  {/* <button
                    onClick={() => fetchPatientDetails(notif.userUid)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Details'}
                  </button> */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
{/* 
      {showPopup && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Patient Details</h3>
              <button 
                onClick={() => setShowPopup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {selectedPatient.image_link && (
                <div className="flex justify-center">
                  <img 
                    src={selectedPatient.image_link} 
                    alt="Patient" 
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{selectedPatient.user_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="font-medium">{selectedPatient.age || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Country</p>
                  <p className="font-medium">{selectedPatient.country}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Occupation</p>
                  <p className="font-medium">{selectedPatient.occupation}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{selectedPatient.address}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Bio</p>
                <p className="font-medium text-gray-700">{selectedPatient.bio}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Health Goal</p>
                <p className="font-medium text-gray-700">{selectedPatient.goal}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default Notifications;