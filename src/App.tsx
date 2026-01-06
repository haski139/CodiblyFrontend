import './App.css'
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend);

const getFuelColor = (fuel: string) => {
  const style = getComputedStyle(document.body);
  switch (fuel) {
    case 'solar': return style.getPropertyValue('--fuel-solar').trim() || '#ffd700';
    case 'wind': return style.getPropertyValue('--fuel-wind').trim() || '#e0ffff';
    case 'hydro': return style.getPropertyValue('--fuel-hydro').trim() || '#00bfff';
    case 'nuclear': return style.getPropertyValue('--fuel-nuclear').trim() || '#39ff14';
    case 'biomass': return style.getPropertyValue('--fuel-biomass').trim() || '#228b22';
    case 'gas': return style.getPropertyValue('--fuel-gas').trim() || '#ff8c00';
    case 'coal': return style.getPropertyValue('--fuel-coal').trim() || '#696969';
    default: return style.getPropertyValue('--fuel-other').trim() || '#d000ff';
  }
};

const getRelativeLabel = (dateStr: string, index: number) => {
  if (index === 0 ) return "TODAY'S MIX";
  if (index === 1 ) return "TOMORROW";
  if (index === 2 ) return "DAY AFTER TOMORROW";

  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long'}).toUpperCase();
}

interface EnergyPieChartProps {
  title: string;
  metrics: { [key: string]: number };
  clean_energy_percent: number;
}

function EnergyPieChart(props: EnergyPieChartProps) {
  
  const activeMetrics = Object.entries(props.metrics)
    .filter(([_, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);

  const labels = activeMetrics.map(([key]) => key);
  const dataValues = activeMetrics.map(([_, value]) => Math.round(value));
  
  const bgColors = labels.map(label => getFuelColor(label));
  const borderColors = labels.map(() => 'transparent');

  const chartData = {
    labels: labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 0,
        hoverOffset: 15,
        cutout: '40%',
      },
    ],
  };

  const options = {
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
    layout: { padding: 10 },
  };

  return (
    <div className="chart-card">
      <h2>{props.title}</h2>
      
      <div className="chart-grid-layout">
        
        <div className="area-chart">
          <div className="doughnut-container">
             <Doughnut data={chartData} options={options} />
          </div>
        </div>

        <div className="area-score">
          <div className="score-label">CLEAN ENERGY:</div>
          <div className="score-value">
            {props.clean_energy_percent.toFixed(0)}% 
            <span className="leaf-icon">🌿</span>
          </div>
        </div>

        <div className="area-legend">
          <ul className="custom-legend">
            {labels.map((label, index) => (
              <li key={label}>
                <span className="color-dot" 
                style={{ '--dot-color':bgColors[index] } as React.CSSProperties }
                ></span>
                <span className="label-text">{label}:</span>
                <span className="label-value">{dataValues[index]}%</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
};

interface OptimalWindow {
  start: string;
  end: string;
  average: number;
}

function App() {
  const [hours, setHours] = useState<number>(3);
  const [optimalWindow, setOptimalWindow] = useState<OptimalWindow | null>(null);
  const [energyData, setEnergyData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const calculateOptimalWindow = () => {
    axios.get(`${import.meta.env.VITE_API_URL}/optimal-charging?hours=${hours}`)
      .then(response => {
        setOptimalWindow(response.data)
      })
  };

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/energy`)
      .then(response => {
        console.log("Backend data: ", response.data);
        setEnergyData(response.data);
      })
      .catch(error => {
        console.log("Error fetching data: ", error);
        setError("Failed to fetch data. Please check if the backend is running.");
      })
  }, []);

  useEffect(() => {
    calculateOptimalWindow();
  }, []);

  if (error) {
    return (
      <div className="container" style={{textAlign: 'center', marginTop: '50px'}}>
        <h2>Oops! Something went wrong 🔌</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="optimizer-btn" style={{maxWidth: '200px'}}>
          TRY AGAIN
        </button>
      </div>
    );
  }
  
  if (energyData.length === 0) {
    return <div>Loading... ⏳</div>;
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="container">
      <h1>UK Clean Energy Tracker & EV Optimizer</h1>

      <div className="charts-wrapper">
        {energyData.map((day, index) => (
        <EnergyPieChart
          key={day.date}
          metrics={day.metrics}
          clean_energy_percent={day.clean_energy_percent}
          title={getRelativeLabel(day.date, index)}
          />
        ))}
      </div> 
      <div className="optimizer-card">
            <h3 className="optimizer-title">Smart EV Charging Optimizer 🔋</h3>
            
            <div className="optimizer-flex-container">
                
                <div className="optimizer-controls">
                    <label style={{ fontSize: '1.2rem' }}>
                        Select Duration: <strong>{hours} HR</strong>
                    </label>
                    
                    <input 
                      type="range" 
                      min="1" 
                      max="6" 
                      value={hours} 
                      onChange={(e) => setHours(parseInt(e.target.value))} 
                    />

                    <button className="optimizer-btn" onClick={calculateOptimalWindow}>
                        CALCULATE OPTIMAL WINDOW
                    </button>
                </div>

                <div className="result-container">
                    <img className="car-image" src="car.png" alt="EV Car" />
                    {optimalWindow && (
                      <div className="window-stats">
                          <h3>OPTIMAL WINDOW FOUND</h3>
                          <div className="stats-row">
                            <span>START:</span> <strong>{formatDate(optimalWindow.start)}</strong>
                          </div>
                          <div className="stats-row">
                            <span>END:</span> <strong>{formatDate(optimalWindow.end)}</strong>
                          </div>
                          <div className="stats-highlight">
                            AVG. CLEAN ENERGY: {optimalWindow.average.toFixed(0)}% 🌿
                          </div>
                      </div>
                    )}
                </div>
            </div>
          </div>    
    </div>
  );
};

export default App