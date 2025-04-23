import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const mockData = {
  locations: {
    'Dawa Industrial': 25,
    'Tema Free Trade': 18,
    'Manet Junction': 15,
    'South ind': 12,
    'Kingsway (Near COCOBOD)': 10
  },
  totalPatients: 80,
  copdPositive: 45
};

const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 24, marginBottom: 20 },
  section: { margin: 10, padding: 10 },
  text: { fontSize: 12, marginBottom: 10 }
});

const ReportPDF = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>COPD Analysis Report</Text>
        <Text style={styles.text}>Total Patients: {mockData.totalPatients}</Text>
        <Text style={styles.text}>COPD Positive Cases: {mockData.copdPositive}</Text>
        <Text style={styles.text}>Positivity Rate: {((mockData.copdPositive / mockData.totalPatients) * 100).toFixed(1)}%</Text>
      </View>
    </Page>
  </Document>
);

const Dashboard = () => {
  const locationData = {
    labels: Object.keys(mockData.locations),
    datasets: [{
      data: Object.values(mockData.locations),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF'
      ]
    }]
  };

  const copdStatusData = {
    labels: ['COPD Positive', 'COPD Negative'],
    datasets: [{
      data: [mockData.copdPositive, mockData.totalPatients - mockData.copdPositive],
      backgroundColor: ['#FF6384', '#36A2EB']
    }]
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <PDFDownloadLink document={<ReportPDF />} fileName="copd-analysis.pdf">
          {({ loading }) => (
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              {loading ? 'Generating PDF...' : 'Download Report'}
            </button>
          )}
        </PDFDownloadLink>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">COPD Cases by Location</h2>
          <div className="h-[300px]">
            <Bar data={locationData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">COPD Status Distribution</h2>
          <div className="h-[300px] flex justify-center">
            <Pie data={copdStatusData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Quick Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Total Patients</p>
              <p className="text-2xl font-bold">{mockData.totalPatients}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">COPD Positive</p>
              <p className="text-2xl font-bold">{mockData.copdPositive}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Positivity Rate</p>
              <p className="text-2xl font-bold">
                {((mockData.copdPositive / mockData.totalPatients) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;