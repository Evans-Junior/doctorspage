import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, Bot, Activity, PlusCircle, FileText, ImageIcon } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

import { collection, doc, getDoc, getDocs, addDoc, serverTimestamp,updateDoc,query,orderBy,onSnapshot, setDoc  } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getVertexAI, getGenerativeModel } from 'firebase/vertexai';
import { useAuthStore } from '../store/auth';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Patient {
  uid: string;
  user_name: string;
  email: string;
  age: number;
  gender?: string;
  address: string;
  country: string;
  bio: string;
  goal: string;
  phone_number?: string;
  image_link?: string;
  occupation?: string;
}

interface ResultData {
  id: string;
  timestamp: Date;
  healthAdvice: string;
  originalSensorInput: Record<string, number>;
  similarityResults: Array<{
    label: string;
    similarity: number;
    sensorReadings: Record<string, number>;
  }>;
}

interface AIMessage {
  sender: 'doctor' | 'bot';
  message: string;
  type: 'text' | 'image' | 'analysis';
  data?: any; // For image URLs or other data
  analysisId?: string; // Optional property for analysis messages
}

const PatientDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [results, setResults] = useState<ResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [showSensorForm, setShowSensorForm] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; message: string }>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [botMessages, setBotMessages] = useState<AIMessage[]>([]);
  const [botInput, setBotInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [includeSensorData, setIncludeSensorData] = useState<boolean>(true);
  const [chatUnsubscribe, setChatUnsubscribe] = useState<any>(null);

  const { doctor} = useAuthStore();


  // Initialize Vertex AI
  const vertexAI = getVertexAI();
  const generativeModel = getGenerativeModel(vertexAI, { model: "gemini-2.0-flash" });




  const currentUserId = doctor?.uid;

  // Fetch patient data and chat messages
useEffect(() => {
  if (!id || !currentUserId) return;

  const chatId = generateChatId(id,currentUserId);
  let unsubscribeChat: (() => void) | null = null;

  const fetchPatientData = async () => {
    try {
      const patientDoc = await getDoc(doc(db, 'users', id));
      if (patientDoc.exists()) {
        setPatient({ uid: id, ...patientDoc.data() } as Patient);
      }

      const resultsSnapshot = await getDocs(collection(db, 'results', id, 'history'));
      const resultsData = resultsSnapshot.docs.map(doc => ({
        id: doc.id,
        timestamp: doc.data().timestamp?.toDate(),
        healthAdvice: doc.data().healthAdvice,
        originalSensorInput: doc.data().originalSensorInput || {},
        similarityResults: doc.data().similarityResults || []
      } as ResultData));

      setResults(resultsData);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupChatListener = () => {
    const chatRef = collection(db, "chats", chatId, "messages");
    const q = query(chatRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const messages = snapshot.docs.map(doc => ({
          sender: doc.data().sender || 'unknown',
          message: doc.data().message || doc.data().text, 
          
        }));
        setChatMessages(messages);
      } catch (error) {
        console.error('Error processing chat messages:', error);
      }
    });

    setChatUnsubscribe(() => unsubscribe);
    unsubscribeChat = unsubscribe;
  };

  fetchPatientData();
  setupChatListener();

  return () => {
    if (unsubscribeChat) unsubscribeChat();
  };
}, [id, currentUserId]);

const generateChatId = (user1: string, user2: string): string => {
  return `chat_${[user1, user2].sort().join("_")}`;
};

  
const sendMessageToPatient = async (patientId: string, message: string) => {
  if (!currentUserId || !patientId || !message) return;

  const chatId = generateChatId(currentUserId, patientId);

  try {
    const messageRef = collection(db, "chats", chatId, "messages");

    await addDoc(messageRef, {
      sender: currentUserId, // doctor or patient UID
      message: message,
      timestamp: serverTimestamp()
    });

    // Ensure chat document exists with participants
    const chatDocRef = doc(db, "chats", chatId);
    await setDoc(chatDocRef, {
      participants: [currentUserId, patientId]
    }, { merge: true });

    console.log("Message sent successfully");
  } catch (error) {
    console.error("Error sending message:", error);
  }
};


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;
  
    await sendMessageToPatient(id, newMessage);
    setNewMessage("");
  };
  

  const handleImageUpload = async (file: File) => {
    if (!id) return null;
    
    try {
      const storageRef = ref(storage, `patient_analysis/${id}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
      
      // ✅ Remove the setBotMessages call here
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };
  

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedData = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    });
    
    return {
      inlineData: { 
        data: base64EncodedData, 
        mimeType: file.type 
      },
    };
  };

  const analyzeWithAI = async (prompt: string, imageParts?: any[]) => {
    let analysisRef: any = null;
    
    try {
      setIsAnalyzing(true);
      
      // Create the analysis document first with all required fields
      analysisRef = await addDoc(collection(db, 'doctorBot'), {
        patientId: id,
        prompt: prompt,
        hasImage: imageParts ? imageParts.length > 0 : false, // Fix the undefined issue
        createdAt: serverTimestamp(),
        status: 'processing',
        response: '', // Initialize empty response
      });
  
      let result;
      if (imageParts && imageParts.length > 0) {
        result = await generativeModel.generateContentStream([prompt, ...imageParts]);
      } else {
        result = await generativeModel.generateContentStream(prompt);
      }
  
      // Stream the response and build it incrementally
      let fullResponse = '';

      // Step 1: Add an empty message to botMessages and track its index
      setBotMessages(prev => {
        const newMsg: AIMessage = {
          sender: 'bot',
          message: '',
          type: 'analysis',
          analysisId: analysisRef.id
        };
        return [...prev, newMsg];
      });
      
      // Step 2: Stream and update the last bot message
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
      
        setBotMessages(prev => {
          const updatedMessages = [...prev];
          const lastIndex = updatedMessages.length - 1;
          if (lastIndex >= 0 && updatedMessages[lastIndex].sender === 'bot') {
            updatedMessages[lastIndex] = {
              ...updatedMessages[lastIndex],
              message: fullResponse
            };
          }
          return updatedMessages;
        });
      }
      
  
      // Update the Firestore document with the complete response
      await updateDoc(analysisRef, {
        response: fullResponse,
        status: 'completed',
        completedAt: serverTimestamp()
      });
  
    } catch (error) {
      console.error('Error analyzing with AI:', error);
      if (analysisRef) {
        await updateDoc(analysisRef, {
          error: (error as any).message,
          status: 'failed',
          completedAt: serverTimestamp()
        });
      }
  
      setBotMessages(prev => [...prev, {
        sender: 'bot',
        message: 'Sorry, there was an error processing your request.',
        type: 'text'
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };
    // Function to load full analysis from Firestore
    const loadFullAnalysis = async (analysisId: string) => {
      try {
        const analysisDoc = await getDoc(doc(db, 'doctorBot', analysisId));
        if (analysisDoc.exists()) {
          const analysisData = analysisDoc.data();
          return analysisData.response || 'No analysis content available';
        }
        return 'Analysis not found';
      } catch (error) {
        console.error('Error loading analysis:', error);
        return 'Error loading analysis';
      }
    };

     // Function to handle clicking on an analysis message to see full content
  const handleAnalysisClick = async (message: AIMessage) => {
    if (message.type === 'analysis' && message.analysisId) {
      const fullAnalysis = await loadFullAnalysis(message.analysisId);
      // Update the message with full content
      setBotMessages(prev => prev.map(msg => 
        msg === message ? { ...msg, message: fullAnalysis } : msg
      ));
    }
  };

  const handleBotMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botInput.trim() && !selectedImage) return;
  
    try {
      // Add doctor's message
      const newMessages: AIMessage[] = [];
      
      if (botInput.trim()) {
        newMessages.push({
          sender: 'doctor',
          message: botInput,
          type: 'text'
        });
      }
      
      let imageUrl: string | null = null;
      if (selectedImage) {
        imageUrl = (await handleImageUpload(selectedImage)) ?? null;
        if (imageUrl) {
          newMessages.push({
            sender: 'doctor',
            message: 'Uploaded medical image',
            type: 'image',
            data: imageUrl
          });
        }
      }
      
      setBotMessages(prev => [...prev, ...newMessages]);
      setBotInput('');
      setSelectedImage(null);
      
      // Prepare the analysis prompt
      let prompt = botInput.trim() || "Please analyze this medical image in the context of COPD diagnosis.";
      
      if (latestResult) {
        prompt += `\n\nPatient sensor data:\n${JSON.stringify(latestResult.originalSensorInput, null, 2)}`;
      }
      
      // If there's an image, analyze with image
      if (selectedImage) {
        const imagePart = await fileToGenerativePart(selectedImage);
        await analyzeWithAI(prompt, [imagePart]);
      } else {
        // Text only analysis
        await analyzeWithAI(prompt);
      }
    } catch (error) {
      console.error('Error handling bot message:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
  };

  // Prepare chart data from the original sensor input
  const prepareChartData = (sensorData: Record<string, number>) => {
    const labels = Object.keys(sensorData).map(key => 
      key.replace('_', ' ').replace('sensor', 'Sensor ')
    );
    
    return {
      labels,
      datasets: [{
        label: 'Sensor Readings',
        data: Object.values(sensorData),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(75, 192, 192)'
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Sensor Readings Analysis',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.raw.toFixed(4)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Sensor Values'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Sensors'
        }
      }
    }
  };

  // Get the latest sensor data for the chart
  const latestResult = results[0];

  // Prepare data for the chart
  const chartData = latestResult ? 
    prepareChartData(latestResult.originalSensorInput) : 
    { labels: [], datasets: [] };
  const sensorData = {
    labels: latestResult ? Object.keys(latestResult.originalSensorInput).map(k => k.replace('_', ' ')) : [],
    datasets: [{
      label: 'Latest Readings',
      data: latestResult ? Object.values(latestResult.originalSensorInput) : [],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <p>Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <p>Patient not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Patient Dashboard - {patient.user_name}</h1>
        <div className="space-x-4">
          <button
            onClick={() => setShowPrescriptionForm(true)}
            className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600"
          >
            <PlusCircle className="inline-block mr-2" size={20} />
            New Prescription
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b px-4 py-3">
              <div className="flex space-x-4">
                <button
                  className={`px-4 py-2 rounded-t-lg ${activeTab === 'chat' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('chat')}
                >
                  <MessageSquare className="inline-block mr-2" size={20} />
                  Chat
                </button>
                <button
                  className={`px-4 py-2 rounded-t-lg ${activeTab === 'bot' ? 'bg-green-500 text-white' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('bot')}
                >
                  <Bot className="inline-block mr-2" size={20} />
                  BreathWise AI
                </button>
                <button
                  className={`px-4 py-2 rounded-t-lg ${activeTab === 'analysis' ? 'bg-purple-500 text-white' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('analysis')}
                >
                  <Activity className="inline-block mr-2" size={20} />
                  Analysis
                </button>
                <button
                  className={`px-4 py-2 rounded-t-lg ${activeTab === 'history' ? 'bg-orange-500 text-white' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('history')}
                >
                  <FileText className="inline-block mr-2" size={20} />
                  History
                </button>
              </div>
            </div>

            <div className="p-4">
            {activeTab === 'chat' && (
  <div className="h-[500px] flex flex-col">
    <div className="flex-1 overflow-y-auto mb-4">
      {chatMessages.map((msg, index) => (
        <div key={index} className={`mb-4 ${msg.sender === doctor?.uid ? 'text-right' : ''}`}>
          <div className={`inline-block p-3 rounded-lg ${
            msg.sender === doctor?.uid ? 'bg-blue-500 text-white' : 'bg-gray-100'
  }`}>
            {msg.message}
          </div>
        </div>
      ))}
    </div>
    <form onSubmit={handleSendMessage} className="mt-auto">
      <div className="flex space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
          placeholder="Type your message..."
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </form>
  </div>
)}

 {activeTab === 'bot' && (
  <div className="h-[500px] flex flex-col">
    {/* Include Analysis Toggle */}
    <div className="mb-2 flex items-center">
      <input
        type="checkbox"
        id="includeAnalysis"
        checked={includeSensorData}
        onChange={() => setIncludeSensorData(!includeSensorData)}
        className="mr-2"
      />
      <label htmlFor="includeAnalysis" className="text-sm text-gray-600">
        Include sensor analysis data in prompt
      </label>
    </div>

    {/* Bot Messages */}
    <div className="flex-1 overflow-y-auto mb-4 space-y-4">
      {botMessages.map((msg, index) => (
        <div key={index} className={`mb-4 ${msg.sender === 'doctor' ? 'text-right' : ''}`}>
          <div
            className={`inline-block p-3 rounded-lg max-w-[80%] cursor-pointer ${
              msg.sender === 'doctor' ? 'bg-green-500 text-white' : 'bg-gray-100'
            } ${msg.type === 'analysis' ? 'hover:bg-gray-200' : ''}`}
            onClick={() => msg.type === 'analysis' && handleAnalysisClick(msg)}
          >
            {msg.type === 'image' ? (
              <div className="flex flex-col items-center">
                <img
                  src={msg.data}
                  alt="Medical analysis"
                  className="max-w-full h-auto rounded max-h-48"
                />
                <p className="mt-2">{msg.message}</p>
              </div>
            ) : (
              <div>
                {msg.message.split('\n').map((paragraph, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : ''}>
                    {paragraph}
                    {i === 0 && msg.type === 'analysis' && msg.message.length > 100 && (
                      <span className="text-blue-500 text-sm ml-2">(click to load full analysis)</span>
                    )}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>

    {/* Chat Input Form */}
    <form onSubmit={handleBotMessage} className="mt-auto flex items-center gap-2 border-t border-gray-300 pt-2">
      <textarea
        value={botInput}
        onChange={(e) => setBotInput(e.target.value)}
        placeholder="Ask something or describe the image..."
        className="flex-1 border rounded-lg p-2 resize-none"
        rows={2}
      />
      
      <div className="flex flex-col items-center">
        <label htmlFor="image-upload" className="cursor-pointer">
          📷
        </label>
        <input
          type="file"
          accept="image/*"
          id="image-upload"
          onChange={handleImageChange}
          className="hidden"
        />
        {selectedImage && (
          <button type="button" onClick={handleImageRemove} className="text-xs text-red-500 mt-1">
            Remove
          </button>
        )}
      </div>

      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        disabled={isAnalyzing}
      >
        {isAnalyzing ? 'Analyzing...' : 'Send'}
      </button>
    </form>
  </div>
)}


              {activeTab === 'analysis' && (
                <div className="h-[700px]">
                  {latestResult ? (
                    <div className="space-y-6">
                      <div className="h-[400px] bg-white p-4 rounded-lg shadow">
                        <Line 
                          data={chartData} 
                          options={chartOptions}
                        />
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-medium mb-2">Raw Sensor Data</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {Object.entries(latestResult.originalSensorInput).map(([sensor, value]) => (
                            <div key={sensor} className="border p-2 rounded">
                              <div className="font-medium text-sm">
                                {sensor.replace('_', ' ')}
                              </div>
                              <div className="text-blue-600">
                                {value.toFixed(4)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p>No sensor data available</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="h-[500px] overflow-y-auto">
                  {results.length > 0 ? (
                    <div className="space-y-4">
                      {results.map((result, index) => (
                        <div key={result.id} className="border-b pb-4">
                          <div className="font-medium">
                            Test #{results.length - index} - {result.timestamp.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            <div className="font-medium">Health Advice:</div>
                            <p>{result.healthAdvice}</p>
                          </div>
                          <div className="mt-2">
                            <div className="font-medium">Similarity Results:</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                              {result.similarityResults.map((sr, i) => (
                                <div key={i} className="border p-2 rounded">
                                  <div className="font-medium">{sr.label}</div>
                                  <div>Similarity: {(sr.similarity * 100).toFixed(2)}%</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p>No test history available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4 mb-4">
              {patient.image_link ? (
                <img 
                  src={patient.image_link} 
                  alt={patient.user_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-xl">{patient.user_name.charAt(0)}</span>
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold">{patient.user_name}</h2>
                <p className="text-sm text-gray-500">{patient.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Age</p>
                <p className="font-medium">{patient.age}</p>
              </div>
              {/* {patient.phone_number && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{patient.phone_number}</p>
                </div>
              )} */}
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{patient.address}, {patient.country}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Occupation</p>
                <p className="font-medium">{patient.occupation || 'Not specified'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">Health Goals</p>
                <p className="font-medium">{patient.goal}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Form Modal */}
      {showPrescriptionForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">New Prescription</h2>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Medication</label>
          <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Patient Category</label>
          <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
            <option value="">Select category</option>
            <option value="COPD">COPD</option>
            <option value="Smokers">Smokers</option>
            <option value="Control">Control</option>
            <option value="Air">Air</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Instructions</label>
          <textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" rows={3}></textarea>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => setShowPrescriptionForm(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Save Prescription
          </button>
        </div>
      </form>
    </div>
  </div>
)}
      {/* Sensor Data Form Modal */}
      {showSensorForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Sensor Data</h2>
            <form className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sensor) => (
                <div key={sensor}>
                  <label className="block text-sm font-medium text-gray-700">
                    Sensor {sensor} Reading
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
              ))}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSensorForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save Readings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;