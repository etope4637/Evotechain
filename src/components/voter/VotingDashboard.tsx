import React, { useState, useEffect } from 'react';
import { Vote, BarChart3, Clock, CheckCircle, Eye, LogOut, User, Shield, Activity } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface VotingDashboardProps {
  onNavigate: (view: string) => void;
  nin: string;
}

interface Election {
  id: string;
  title: string;
  type: string;
  status: 'active' | 'upcoming' | 'completed';
  startDate: Date;
  endDate: Date;
  candidates: Array<{
    id: string;
    name: string;
    party: string;
    voteCount: number;
  }>;
  hasVoted: boolean;
  totalVotes: number;
}

export const VotingDashboard: React.FC<VotingDashboardProps> = ({ onNavigate, nin }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'elections' | 'voting'>('dashboard');
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<{ [electionId: string]: string }>({});
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = () => {
    // Demo elections data
    const demoElections: Election[] = [
      {
        id: '1',
        title: '2024 Presidential Election',
        type: 'Presidential',
        status: 'active',
        startDate: new Date('2024-02-25T08:00:00'),
        endDate: new Date('2024-02-25T16:00:00'),
        hasVoted: false,
        totalVotes: 15420,
        candidates: [
          { id: '1a', name: 'Candidate A', party: 'Party A', voteCount: 6500 },
          { id: '1b', name: 'Candidate B', party: 'Party B', voteCount: 5200 },
          { id: '1c', name: 'Candidate C', party: 'Party C', voteCount: 3720 }
        ]
      },
      {
        id: '2',
        title: 'Lagos State Gubernatorial Election',
        type: 'Gubernatorial',
        status: 'active',
        startDate: new Date('2024-03-11T08:00:00'),
        endDate: new Date('2024-03-11T16:00:00'),
        hasVoted: false,
        totalVotes: 8930,
        candidates: [
          { id: '2a', name: 'Candidate X', party: 'Party X', voteCount: 4200 },
          { id: '2b', name: 'Candidate Y', party: 'Party Y', voteCount: 3100 },
          { id: '2c', name: 'Candidate Z', party: 'Party Z', voteCount: 1630 }
        ]
      },
      {
        id: '3',
        title: 'National Assembly Election',
        type: 'National Assembly',
        status: 'upcoming',
        startDate: new Date('2024-04-15T08:00:00'),
        endDate: new Date('2024-04-15T16:00:00'),
        hasVoted: false,
        totalVotes: 0,
        candidates: [
          { id: '3a', name: 'Hon. Candidate P', party: 'Party P', voteCount: 0 },
          { id: '3b', name: 'Hon. Candidate Q', party: 'Party Q', voteCount: 0 }
        ]
      }
    ];
    
    setElections(demoElections);
  };

  const handleVote = async (electionId: string, candidateId: string) => {
    setIsVoting(true);
    
    try {
      // Simulate vote submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update election data
      setElections(prev => prev.map(election => {
        if (election.id === electionId) {
          return {
            ...election,
            hasVoted: true,
            totalVotes: election.totalVotes + 1,
            candidates: election.candidates.map(candidate => 
              candidate.id === candidateId 
                ? { ...candidate, voteCount: candidate.voteCount + 1 }
                : candidate
            )
          };
        }
        return election;
      }));
      
      setSelectedElection(null);
      alert('Vote submitted successfully! Your vote has been recorded on the blockchain.');
    } catch (error) {
      alert('Error submitting vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  const getElectionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultsData = (election: Election) => {
    return {
      labels: election.candidates.map(c => c.name),
      datasets: [{
        data: election.candidates.map(c => c.voteCount),
        backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'],
        borderWidth: 0
      }]
    };
  };

  const activeElections = elections.filter(e => e.status === 'active');
  const upcomingElections = elections.filter(e => e.status === 'upcoming');
  const completedElections = elections.filter(e => e.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <Vote className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Voting Dashboard</h1>
                <p className="text-xs text-gray-600">NIN: {nin.slice(0, 3)}***{nin.slice(-2)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Authenticated</span>
              </div>
              <button
                onClick={() => onNavigate('voter-portal')}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'elections', label: 'Elections', icon: Vote },
              { id: 'voting', label: 'Cast Vote', icon: CheckCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Election Overview</h2>
              <p className="text-gray-600">Real-time election monitoring and your voting status</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Elections</p>
                    <p className="text-3xl font-bold text-green-600">{activeElections.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Votes Cast</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {elections.filter(e => e.hasVoted).length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Upcoming Elections</p>
                    <p className="text-3xl font-bold text-purple-600">{upcomingElections.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Participation</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {elections.length > 0 ? Math.round((elections.filter(e => e.hasVoted).length / elections.length) * 100) : 0}%
                    </p>
                  </div>
                  <User className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Real-time Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeElections.slice(0, 2).map((election) => (
                <div key={election.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">{election.title} - Live Results</h3>
                  <div className="h-64">
                    <Doughnut 
                      data={getResultsData(election)} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'bottom' }
                        }
                      }}
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Total Votes: {election.totalVotes.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Elections Tab */}
        {activeTab === 'elections' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">All Elections</h2>
              <p className="text-gray-600">View all available elections and their status</p>
            </div>

            <div className="space-y-4">
              {elections.map((election) => (
                <div key={election.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{election.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getElectionStatusColor(election.status)}`}>
                            {election.status}
                          </span>
                          {election.hasVoted && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Voted
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">{election.type} Election</p>
                        <div className="text-sm text-gray-600">
                          <p>Start: {election.startDate.toLocaleString()}</p>
                          <p>End: {election.endDate.toLocaleString()}</p>
                          <p>Total Votes: {election.totalVotes.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedElection(election)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {election.status === 'active' && !election.hasVoted && (
                          <button
                            onClick={() => {
                              setSelectedElection(election);
                              setActiveTab('voting');
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Vote Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voting Tab */}
        {activeTab === 'voting' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Cast Your Vote</h2>
              <p className="text-gray-600">Select your preferred candidates for active elections</p>
            </div>

            {activeElections.filter(e => !e.hasVoted).length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">All Votes Cast</h3>
                <p className="text-gray-600">You have voted in all available elections.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {activeElections.filter(e => !e.hasVoted).map((election) => (
                  <div key={election.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-green-50 border-b border-green-200 p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{election.title}</h3>
                      <p className="text-gray-600">{election.type} Election</p>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Voting ends: {election.endDate.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Select Your Candidate:</h4>
                      <div className="space-y-3">
                        {election.candidates.map((candidate) => (
                          <label
                            key={candidate.id}
                            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedCandidates[election.id] === candidate.id
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`election-${election.id}`}
                              value={candidate.id}
                              checked={selectedCandidates[election.id] === candidate.id}
                              onChange={() => setSelectedCandidates(prev => ({
                                ...prev,
                                [election.id]: candidate.id
                              }))}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                              selectedCandidates[election.id] === candidate.id
                                ? 'border-green-500 bg-green-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedCandidates[election.id] === candidate.id && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800">{candidate.name}</div>
                              <div className="text-sm text-gray-600">{candidate.party}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Current Votes</div>
                              <div className="font-semibold text-gray-800">{candidate.voteCount.toLocaleString()}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                      
                      {selectedCandidates[election.id] && (
                        <div className="mt-6 flex justify-center">
                          <button
                            onClick={() => handleVote(election.id, selectedCandidates[election.id])}
                            disabled={isVoting}
                            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                          >
                            {isVoting ? 'Submitting Vote...' : 'Submit Vote'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Election Details Modal */}
      {selectedElection && activeTab !== 'voting' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedElection.title}</h3>
                  <p className="text-gray-600">{selectedElection.type} Election</p>
                </div>
                <button
                  onClick={() => setSelectedElection(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Current Results:</h4>
                  {selectedElection.candidates.map((candidate, index) => (
                    <div key={candidate.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-2">
                      <div>
                        <div className="font-medium">{candidate.name}</div>
                        <div className="text-sm text-gray-600">{candidate.party}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{candidate.voteCount.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">
                          {selectedElection.totalVotes > 0 
                            ? ((candidate.voteCount / selectedElection.totalVotes) * 100).toFixed(1)
                            : 0
                          }%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600">
                    Total Votes Cast: {selectedElection.totalVotes.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Results update in real-time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};