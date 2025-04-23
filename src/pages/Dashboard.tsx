import React, { useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { AlertTriangle, FileText, Send } from 'lucide-react';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
);

const mockData = {
  locations: {
    'Dawa Industrial': {
      copd: 25,
      control: 15,
      air: 30,
      smokers: 20,
      airQualityIndex: 156, // Poor
      monthlyTrend: [20, 22, 24, 25, 27, 25]
    },
    'Tema Free Trade': {
      copd: 18,
      control: 12,
      air: 25,
      smokers: 15,
      airQualityIndex: 142, // Moderate
      monthlyTrend: [15, 16, 17, 18, 18, 18]
    },
    'Manet Junction': {
      copd: 15,
      control: 10,
      air: 20,
      smokers: 12,
      airQualityIndex: 168, // Unhealthy
      monthlyTrend: [12, 13, 14, 15, 15, 15]
    },
    'South Industrial': {
      copd: 22,
      control: 14,
      air: 28,
      smokers: 18,
      airQualityIndex: 175, // Very Unhealthy
      monthlyTrend: [18, 19, 20, 21, 22, 22]
    }
  },
  totalPatients: 80,
  copdPositive: 45,
  monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
};

const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 24, marginBottom: 20, color: '#1a365d' },
  subtitle: { fontSize: 18, marginBottom: 15, color: '#2c5282' },
  section: { margin: 10, padding: 10, borderBottom: 1 },
  text: { fontSize: 12, marginBottom: 10 },
  alert: { fontSize: 14, marginBottom: 15, color: '#c53030' },
  locationHeader: { fontSize: 16, marginTop: 20, marginBottom: 10, color: '#2c5282' },
  grid: { display: 'flex', flexDirection: 'row', marginBottom: 10 },
  gridItem: { flex: 1, marginRight: 10 }
});

interface ReportProps {
  location: string;
  data: {
    copd: number;
    control: number;
    air: number;
    smokers: number;
    airQualityIndex: number;
  };
}

const LocationReport: React.FC<ReportProps> = ({ location, data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>COPD Health Risk Report</Text>
        <Text style={styles.subtitle}>{location}</Text>
        
        <Text style={styles.text}>Report Date: {new Date().toLocaleDateString()}</Text>
        
        <Text style={styles.locationHeader}>Health Statistics</Text>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.text}>COPD Cases: {data.copd}</Text>
            <Text style={styles.text}>Control Group: {data.control}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.text}>Air Quality Cases: {data.air}</Text>
            <Text style={styles.text}>Smokers: {data.smokers}</Text>
          </View>
        </View>

        {data.airQualityIndex > 150 && (
          <Text style={styles.alert}>
            ⚠️ HIGH RISK ALERT: Air Quality Index of {data.airQualityIndex} exceeds healthy levels
          </Text>
        )}

        <Text style={styles.locationHeader}>Recommendations</Text>
        <Text style={styles.text}>
          1. Implement immediate air quality monitoring
          {data.airQualityIndex > 150 ? ' and control measures' : ''}
        </Text>
        <Text style={styles.text}>
          2. Conduct community health awareness programs
        </Text>
        <Text style={styles.text}>
          3. Establish regular health screening camps
        </Text>
        
        <Text style={styles.text}>
          This report is generated for health authorities and requires immediate attention
          {data.airQualityIndex > 150 ? ' due to critical air quality levels' : ''}.
        </Text>
      </View>
    </Page>
  </Document>
);

const Dashboard = () => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const locationData = {
    labels: Object.keys(mockData.locations),
    datasets: [
      {
        label: 'COPD Cases',
        data: Object.values(mockData.locations).map(loc => loc.copd),
        backgroundColor: '#FF6384',
      },
      {
        label: 'Control Group',
        data: Object.values(mockData.locations).map(loc => loc.control),
        backgroundColor: '#36A2EB',
      },
      {
        label: 'Air Quality Cases',
        data: Object.values(mockData.locations).map(loc => loc.air),
        backgroundColor: '#4BC0C0',
      },
      {
        label: 'Smokers',
        data: Object.values(mockData.locations).map(loc => loc.smokers),
        backgroundColor: '#FFCE56',
      }
    ]
  };

  const trendData = {
    labels: mockData.monthNames,
    datasets: Object.entries(mockData.locations).map(([location, data], index) => ({
      label: location,
      data: data.monthlyTrend,
      borderColor: ['#FF6384', '#36A2EB', '#4BC0C0', '#FFCE56'][index],
      fill: false
    }))
  };

  const handleReportSubmission = (location: string) => {
    // Simulate sending report to authorities
    console.log(`Sending report for ${location}`);
    setShowReportModal(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">COPD Analytics Dashboard</h1>
        <div className="flex gap-4">
          <PDFDownloadLink 
            document={
              <LocationReport 
                location="All Locations" 
                data={mockData.locations['Dawa Industrial']} 
              />
            } 
            fileName="copd-analysis.pdf"
          >
            {({ loading }) => (
              <button className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 flex items-center gap-2">
                <FileText size={20} />
                {loading ? 'Generating Report...' : 'Download Report'}
              </button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Cases Distribution by Location</h2>
          <div className="h-[300px]">
            <Bar 
              data={locationData} 
              options={{ 
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Number of Cases'
                    }
                  }
                }
              }} 
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Monthly COPD Trends for Dawa Industrial</h2>
          <div className="h-[300px]">
            <Line 
              data={trendData} 
              options={{ 
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Number of Cases'
                    }
                  }
                }
              }} 
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Location Health Risk Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(mockData.locations).map(([location, data]) => (
              <div key={location} className={`p-4 rounded-lg ${
                data.airQualityIndex > 150 ? 'bg-red-50' : 'bg-teal-50'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{location}</h3>
                  {data.airQualityIndex > 150 && (
                    <AlertTriangle className="text-red-500" size={20} />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm">COPD Cases: <span className="font-bold">{data.copd}</span></p>
                  <p className="text-sm">Air Quality Index: <span className={`font-bold ${
                    data.airQualityIndex > 150 ? 'text-red-600' : 'text-green-600'
                  }`}>{data.airQualityIndex}</span></p>
                  <button
                    onClick={() => {
                      setSelectedLocation(location);
                      setShowReportModal(true);
                    }}
                    className="mt-2 w-full bg-teal-500 text-white px-3 py-1 rounded hover:bg-teal-600 flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    Send Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Submission Modal */}
      {showReportModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Submit Report for {selectedLocation}</h2>
            <p className="text-gray-600 mb-4">
              This report will be sent to local and national health authorities for immediate action.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReportSubmission(selectedLocation)}
                className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 flex items-center gap-2"
              >
                <Send size={16} />
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;