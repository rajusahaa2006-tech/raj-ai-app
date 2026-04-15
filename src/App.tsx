/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  BookOpen, 
  Calendar, 
  Home, 
  ShieldAlert, 
  UserCircle, 
  Bell, 
  Search, 
  TrendingUp, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  PlayCircle,
  FileText,
  Download,
  Plus,
  Send,
  LogOut,
  Menu,
  X,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { generateStudyNotes, analyzeIncidentSeverity } from '@/src/services/gemini';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/src/lib/utils';

// --- Types ---

type Tab = 'dashboard' | 'placement' | 'study' | 'timetable' | 'hostel' | 'budget' | 'safety' | 'admin' | 'profile';

interface User {
  name: string;
  roll: string;
  dept: string;
  year: string;
  sem: string;
  cgpa: number;
  attendance: number;
  avatar: string; // URL or Initials
  email: string;
}

// ... (rest of types and mock data)

interface Job {
  id: string;
  title: string;
  company: string;
  ctc: string;
  deadline: string;
  source: 'linkedin' | 'naukri';
  skills: string[];
  match: number;
  location: string;
}

interface Video {
  id: string;
  title: string;
  channel: string;
  views: string;
  duration: string;
  thumbnail: string;
}

// --- Mock Data ---

const ATTENDANCE_DATA = [
  { name: 'Mon', value: 85 },
  { name: 'Tue', value: 78 },
  { name: 'Wed', value: 82 },
  { name: 'Thu', value: 74 },
  { name: 'Fri', value: 78 },
];

const SUBJECT_ATTENDANCE = [
  { name: 'Data Structures', present: 28, total: 34, color: '#6366f1' },
  { name: 'DBMS', present: 24, total: 32, color: '#8b5cf6' },
  { name: 'Computer Networks', present: 26, total: 30, color: '#ec4899' },
  { name: 'OS', present: 20, total: 28, color: '#f43f5e' },
  { name: 'Web Tech', present: 18, total: 20, color: '#10b981' },
];

const JOBS: Job[] = [
  { id: '1', title: 'Systems Engineer', company: 'Infosys', ctc: '₹3.6L', deadline: '18 Apr', source: 'linkedin', skills: ['Java', 'Python', 'SQL'], match: 87, location: 'Bangalore' },
  { id: '2', title: 'Digital Trainee', company: 'TCS', ctc: '₹3.36L', deadline: '22 Apr', source: 'naukri', skills: ['Java', 'Communication'], match: 82, location: 'Multiple' },
  { id: '3', title: 'Software Dev Intern', company: 'Wipro', ctc: '₹25K/mo', deadline: '25 Apr', source: 'naukri', skills: ['Python', 'React'], match: 74, location: 'Hyderabad' },
  { id: '4', title: 'SDE Intern', company: 'Amazon', ctc: '₹50K/mo', deadline: '30 Apr', source: 'linkedin', skills: ['DSA', 'Java', 'System Design'], match: 61, location: 'Bangalore' },
  { id: '5', title: 'Frontend Dev', company: 'Freshworks', ctc: '₹8L', deadline: '20 Apr', source: 'linkedin', skills: ['React', 'JS', 'CSS'], match: 78, location: 'Chennai' },
];

const VIDEOS: Video[] = [
  { id: 'v1', title: 'Binary Search Tree — Full Explanation', channel: 'Abdul Bari', views: '4.2M', duration: '28 min', thumbnail: 'https://picsum.photos/seed/code1/320/180' },
  { id: 'v2', title: 'Database Normalization 1NF 2NF 3NF', channel: 'Neso Academy', views: '5.1M', duration: '31 min', thumbnail: 'https://picsum.photos/seed/db1/320/180' },
  { id: 'v3', title: 'OSI Model — All 7 Layers', channel: 'Kunal Kushwaha', views: '3.8M', duration: '42 min', thumbnail: 'https://picsum.photos/seed/net1/320/180' },
];

// --- Components ---

const Card = ({ children, className, title, subtitle, icon: Icon }: { children: React.ReactNode, className?: string, title?: string, subtitle?: string, icon?: any }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-hidden", className)}
  >
    {(title || Icon) && (
      <div className="flex items-center justify-between mb-4">
        <div>
          {title && <h3 className="text-sm font-semibold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && <Icon className="w-5 h-5 text-slate-400" />}
      </div>
    )}
    {children}
  </motion.div>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' }) => {
  const variants = {
    default: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border border-amber-100",
    error: "bg-rose-50 text-rose-700 border border-rose-100",
    info: "bg-sky-50 text-sky-700 border border-sky-100",
    purple: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", variants[variant])}>
      {children}
    </span>
  );
};

// --- Main App ---

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupDept, setSignupDept] = useState('Information Technology');
  const [signupAvatar, setSignupAvatar] = useState('https://picsum.photos/seed/user/200');

  // AI States
  const [studyTopic, setStudyTopic] = useState('');
  const [detailLevel, setDetailLevel] = useState('Standard (3 pages)');
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);

  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentAnalysis, setIncidentAnalysis] = useState<any>(null);
  const [isAnalyzingIncident, setIsAnalyzingIncident] = useState(false);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const handleGenerateNotes = async () => {
    if (!studyTopic) return;
    setIsGeneratingNotes(true);
    const notes = await generateStudyNotes(studyTopic, detailLevel);
    setGeneratedNotes(notes);
    setIsGeneratingNotes(false);
  };

  const handleAnalyzeIncident = async () => {
    if (!incidentDesc) return;
    setIsAnalyzingIncident(true);
    const analysis = await analyzeIncidentSeverity(incidentDesc);
    setIncidentAnalysis(analysis);
    setIsAnalyzingIncident(false);
  };

  const handleAdminLogin = () => {
    if (adminUser === 'PROF01' && adminPass === 'admin123') {
      setIsAdminLoggedIn(true);
    } else {
      alert('Invalid credentials. Demo: PROF01 / admin123');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login with mock data or any input
    const mockUser: User = {
      name: loginEmail.split('@')[0] || "User",
      roll: "ST" + Math.floor(Math.random() * 10000),
      dept: "Computer Science",
      year: "3rd Year",
      sem: "Sem 5",
      cgpa: 8.5,
      attendance: 82,
      avatar: signupAvatar,
      email: loginEmail
    };
    setUser(mockUser);
    setIsLoggedIn(true);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      name: signupName,
      roll: "ST" + Math.floor(Math.random() * 10000),
      dept: signupDept,
      year: "1st Year",
      sem: "Sem 1",
      cgpa: 0.0,
      attendance: 100,
      avatar: signupAvatar,
      email: signupEmail
    };
    setUser(newUser);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setActiveTab('dashboard');
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'placement', label: 'Placement', icon: Briefcase },
    { id: 'study', label: 'Study AI', icon: BookOpen },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'hostel', label: 'Hostel', icon: Home },
    { id: 'budget', label: 'Budget', icon: TrendingUp },
    { id: 'safety', label: 'Safety', icon: ShieldAlert },
    { id: 'admin', label: 'Admin', icon: UserCircle },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
        >
          <div className="p-8">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-slate-900">SmartCampus</span>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
                  <p className="text-slate-500 text-sm">Sign in to your campus account</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@university.edu" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Password</label>
                  <input 
                    type="password" 
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                  />
                </div>
                <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
                  Sign In
                </button>
                <p className="text-center text-xs text-slate-500">
                  Don't have an account? <button type="button" onClick={() => setAuthMode('signup')} className="text-indigo-600 font-bold hover:underline">Create one</button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Create Profile</h2>
                  <p className="text-slate-500 text-sm">Join your campus community</p>
                </div>
                
                <div className="flex justify-center mb-6">
                  <div className="relative group cursor-pointer" onClick={() => setSignupAvatar(`https://picsum.photos/seed/${Math.random()}/200`)}>
                    <img src={signupAvatar} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md group-hover:opacity-80 transition-opacity" />
                    <div className="absolute -bottom-2 -right-2 bg-indigo-600 p-1.5 rounded-lg text-white shadow-md">
                      <Plus className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Enter your name" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@university.edu" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Department</label>
                  <select 
                    value={signupDept}
                    onChange={(e) => setSignupDept(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                  >
                    <option>Information Technology</option>
                    <option>Computer Science</option>
                    <option>Electronics</option>
                    <option>Mechanical</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all mt-2">
                  Create Account
                </button>
                <p className="text-center text-xs text-slate-500">
                  Already have an account? <button type="button" onClick={() => setAuthMode('login')} className="text-indigo-600 font-bold hover:underline">Sign in</button>
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    if (!user) return null;
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back, {user.name.split(' ')[0]}</h1>
                <p className="text-slate-500 text-sm">Here's what's happening on campus today.</p>
              </div>
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 text-slate-600 rounded-lg text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card title="Attendance" icon={TrendingUp}>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-bold text-indigo-600">{user.attendance}%</span>
                    <p className="text-xs text-slate-500 mt-1">Overall this semester</p>
                  </div>
                  <div className="h-16 w-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={ATTENDANCE_DATA}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke="#6366f1" fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>

              <Card title="Academic Performance" icon={Zap}>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-bold text-slate-900">{user.cgpa}</span>
                    <p className="text-xs text-slate-500 mt-1">Current CGPA</p>
                  </div>
                  <Badge variant="success">Top 10%</Badge>
                </div>
              </Card>

              <Card title="Placement Opportunities" icon={Briefcase}>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-bold text-slate-900">12</span>
                    <p className="text-xs text-slate-500 mt-1">New matching jobs</p>
                  </div>
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        {i === 3 ? '+9' : 'JD'}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="AI Insights & Alerts" icon={Bell}>
                <div className="space-y-4">
                  <div className="flex gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-amber-900">Attendance Warning</h4>
                      <p className="text-[11px] text-amber-700 mt-0.5">DBMS attendance is at 74.8%. Attend tomorrow's lab to stay above 75% eligibility.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <Zap className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-indigo-900">Placement Match</h4>
                      <p className="text-[11px] text-indigo-700 mt-0.5">Infosys drive in 3 days — your resume scores 87% match. AI suggests applying now.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-sky-50 border border-sky-100 rounded-xl">
                    <Clock className="w-5 h-5 text-sky-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-sky-900">Class Update</h4>
                      <p className="text-[11px] text-sky-700 mt-0.5">Prof. Sharma (DS) shifted class to Room 305. Starts 15 min late at 9:15 AM.</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Today's Schedule" icon={Calendar}>
                <div className="space-y-4">
                  {[
                    { time: '09:15 AM', subject: 'Data Structures', room: 'Room 305', status: 'delayed', prof: 'Prof. Sharma' },
                    { time: '11:00 AM', subject: 'DBMS Lab', room: 'Lab 2', status: 'on-time', prof: 'Prof. Das' },
                    { time: '02:00 PM', subject: 'Computer Networks', room: 'Room 205', status: 'on-time', prof: 'Prof. Roy' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 group">
                      <div className="w-16 text-[11px] font-bold text-slate-400">{item.time}</div>
                      <div className="flex-1 p-3 rounded-xl border border-slate-100 group-hover:border-indigo-100 group-hover:bg-indigo-50/30 transition-all">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-slate-900">{item.subject}</h4>
                          <Badge variant={item.status === 'delayed' ? 'warning' : 'success'}>
                            {item.status === 'delayed' ? '15m Delay' : 'On Time'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {item.room}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <UserCircle className="w-3 h-3" /> {item.prof}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        );

      case 'placement':
        return (
          <div className="space-y-6">
            <header>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Placement Portal</h1>
              <p className="text-slate-500 text-sm">Real-time job feeds from LinkedIn & Naukri.com</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">Live Opportunities</h2>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-[10px] font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Filter</button>
                    <button className="px-3 py-1 text-[10px] font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Refresh</button>
                  </div>
                </div>
                {JOBS.map(job => (
                  <Card key={job.id} className="hover:border-indigo-200 transition-colors group">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                          <Briefcase className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                          <p className="text-xs text-slate-500">{job.company} • {job.location}</p>
                          <div className="flex gap-2 mt-2">
                            {job.skills.map(s => <Badge key={s}>{s}</Badge>)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={job.source === 'linkedin' ? 'info' : 'warning'}>
                          {job.source === 'linkedin' ? 'LinkedIn' : 'Naukri'}
                        </Badge>
                        <p className="text-[10px] text-slate-400 mt-2">Deadline: {job.deadline}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 max-w-xs">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${job.match}%` }} />
                        </div>
                        <span className="text-xs font-bold text-indigo-600">{job.match}% Match</span>
                      </div>
                      <button className="px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors">
                        Apply Now
                      </button>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="space-y-6">
                <Card title="AI Resume Analysis" icon={Zap}>
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Optimize your profile</h4>
                    <p className="text-[11px] text-slate-500 mt-1 mb-4">Upload your resume to see how you match with top companies.</p>
                    <button className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
                      Analyze Resume
                    </button>
                  </div>
                </Card>

                <Card title="Eligibility Check" icon={CheckCircle2}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Min CGPA (7.0)</span>
                      <Badge variant="success">Pass (8.4)</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Attendance (75%)</span>
                      <Badge variant="success">Pass (78%)</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Backlogs</span>
                      <Badge variant="success">0 (Pass)</Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        );

      case 'study':
        return (
          <div className="space-y-6">
            <header>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Study AI</h1>
              <p className="text-slate-500 text-sm">Smart resources tailored to your syllabus</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <Card title="Syllabus Sync" icon={Zap}>
                  <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer">
                    <Plus className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-[10px] font-medium text-slate-500">Upload Syllabus PDF</p>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Subjects</p>
                    {['Data Structures', 'DBMS', 'OS', 'Networks'].map(s => (
                      <button key={s} className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-50 transition-colors flex items-center justify-between group">
                        <span className="text-slate-700">{s}</span>
                        <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500" />
                      </button>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-3 space-y-6">
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex-1 flex items-center gap-3 px-4">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search topics (e.g. B+ Trees, Normalization)..." 
                      className="w-full bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  <select className="bg-slate-50 border-none outline-none text-xs font-semibold text-slate-600 px-4 py-2 rounded-xl">
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Bengali</option>
                  </select>
                  <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all">
                    Find Videos
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {VIDEOS.map(video => (
                    <Card key={video.id} className="p-0 overflow-hidden group">
                      <div className="relative aspect-video overflow-hidden">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlayCircle className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-bold rounded">
                          {video.duration}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-relaxed">{video.title}</h3>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[10px] text-slate-500 font-medium">{video.channel}</span>
                          <span className="text-[10px] text-slate-400">{video.views} views</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <Card title="AI Note Generator" icon={Zap}>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Topic</label>
                          <input 
                            type="text" 
                            value={studyTopic}
                            onChange={(e) => setStudyTopic(e.target.value)}
                            placeholder="e.g. Binary Trees" 
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Detail Level</label>
                          <select 
                            value={detailLevel}
                            onChange={(e) => setDetailLevel(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all"
                          >
                            <option>Concise (1 page)</option>
                            <option>Standard (3 pages)</option>
                            <option>Detailed (5+ pages)</option>
                          </select>
                        </div>
                      </div>
                      <button 
                        onClick={handleGenerateNotes}
                        disabled={isGeneratingNotes || !studyTopic}
                        className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isGeneratingNotes ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4 text-indigo-400" />}
                        {isGeneratingNotes ? 'Generating...' : 'Generate Notes with AI'}
                      </button>
                    </div>
                    <div className="w-full md:w-64 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-start text-left overflow-y-auto max-h-64">
                      {generatedNotes ? (
                        <div className="prose prose-xs prose-slate max-w-none">
                          <ReactMarkdown>{generatedNotes}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full text-center">
                          <FileText className="w-8 h-8 text-slate-300 mb-2" />
                          <p className="text-[10px] text-slate-500">AI notes will appear here.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        );

      case 'safety':
        return (
          <div className="space-y-6">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Safety & Anti-Ragging</h1>
                <p className="text-slate-500 text-sm">Your safety is our priority. Reports are 100% anonymous.</p>
              </div>
              <button className="px-6 py-3 bg-rose-600 text-white font-bold rounded-2xl shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all flex items-center gap-2 animate-pulse">
                <ShieldAlert className="w-5 h-5" /> SOS EMERGENCY
              </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card title="Anonymous Incident Report" icon={ShieldAlert}>
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl mb-6">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <p className="text-xs text-rose-800 leading-relaxed">
                        Reports are encrypted and sent directly to the <strong>Anti-Ragging Committee</strong>. Your identity is never revealed to students or staff.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Incident Type</label>
                        <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-rose-500 transition-all">
                          <option>Select type...</option>
                          <option>Verbal abuse / Bullying</option>
                          <option>Physical harassment</option>
                          <option>Mental pressure</option>
                          <option>Ragging in hostel</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Location</label>
                        <input type="text" placeholder="e.g. Hostel Block B" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-rose-500 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                      <textarea 
                        rows={4} 
                        value={incidentDesc}
                        onChange={(e) => setIncidentDesc(e.target.value)}
                        placeholder="Describe what happened in detail..." 
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-rose-500 transition-all resize-none" 
                      />
                    </div>
                    
                    {incidentAnalysis && (
                      <div className={cn(
                        "p-4 rounded-xl border",
                        incidentAnalysis.severity === 'HIGH' ? "bg-rose-50 border-rose-100" : 
                        incidentAnalysis.severity === 'MEDIUM' ? "bg-amber-50 border-amber-100" : "bg-sky-50 border-sky-100"
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider">AI Severity Analysis: {incidentAnalysis.severity}</h4>
                          <Badge variant={incidentAnalysis.severity === 'HIGH' ? 'error' : incidentAnalysis.severity === 'MEDIUM' ? 'warning' : 'info'}>
                            {incidentAnalysis.severity}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-700 mb-2">{incidentAnalysis.reasoning}</p>
                        <div className="p-2 bg-white/50 rounded-lg border border-white/50">
                          <p className="text-[10px] font-bold text-slate-900">Recommended Action:</p>
                          <p className="text-[10px] text-slate-600">{incidentAnalysis.action}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <button 
                        onClick={handleAnalyzeIncident}
                        disabled={isAnalyzingIncident || !incidentDesc}
                        className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
                      >
                        {isAnalyzingIncident ? 'Analyzing...' : 'AI Analyze Severity'}
                      </button>
                      <button className="px-8 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-all">
                        Submit Secure Report
                      </button>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card title="Emergency Contacts" icon={Bell}>
                  <div className="space-y-4">
                    {[
                      { name: 'UGC Helpline', number: '1800-180-5522', desc: '24x7 Free Call' },
                      { name: 'Campus Security', number: '+91 98300 00001', desc: 'Immediate Response' },
                      { name: 'Student Counselor', number: '+91 98300 00002', desc: 'Confidential Support' },
                      { name: 'Police Emergency', number: '100', desc: 'External Help' },
                    ].map((contact, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{contact.name}</h4>
                          <p className="text-[10px] text-slate-500">{contact.desc}</p>
                        </div>
                        <span className="text-xs font-bold text-indigo-600">{contact.number}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        );

      case 'hostel':
        return (
          <div className="space-y-6">
            <header>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hostel Management</h1>
              <p className="text-slate-500 text-sm">Manage your stay and raise maintenance requests.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Raise a Complaint" icon={Home}>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Issue Type</label>
                    <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all">
                      <option>Maintenance</option>
                      <option>Mess / Food</option>
                      <option>Cleanliness</option>
                      <option>Electricity</option>
                      <option>Internet</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                    <textarea rows={3} placeholder="Describe the issue..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all resize-none" />
                  </div>
                  <button className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all">
                    Submit Complaint
                  </button>
                </div>
              </Card>
              <Card title="Recent Complaints" icon={Clock}>
                <div className="space-y-4">
                  <div className="p-3 rounded-xl border border-amber-100 bg-amber-50">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-amber-900">Fan not working — Room 204</h4>
                      <Badge variant="warning">In Progress</Badge>
                    </div>
                    <p className="text-[10px] text-amber-700 mt-1">Raised 2 days ago</p>
                  </div>
                  <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-emerald-900">Bad food quality — Dinner</h4>
                      <Badge variant="success">Resolved</Badge>
                    </div>
                    <p className="text-[10px] text-emerald-700 mt-1">Raised 5 days ago</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      case 'budget':
        return (
          <div className="space-y-6">
            <header>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Budget Tracker</h1>
              <p className="text-slate-500 text-sm">Monitor your monthly expenses and AI forecasts.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Spending Overview" icon={TrendingUp}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-3xl font-bold text-slate-900">₹3,760</span>
                    <p className="text-xs text-slate-500 mt-1">Spent of ₹6,000 budget</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-rose-600">₹5,900</span>
                    <p className="text-[10px] text-slate-500 mt-1">AI Forecast for month-end</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { cat: 'Food', spent: 1800, budget: 2000, color: '#6366f1' },
                    { cat: 'Travel', spent: 640, budget: 800, color: '#10b981' },
                    { cat: 'Books', spent: 520, budget: 500, color: '#f43f5e' },
                    { cat: 'Misc', spent: 800, budget: 700, color: '#f59e0b' },
                  ].map((c, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-medium text-slate-700">{c.cat}</span>
                        <span className="text-slate-500">₹{c.spent} / ₹{c.budget}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (c.spent/c.budget)*100)}%`, backgroundColor: c.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card title="Add Expense" icon={Plus}>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                    <input type="text" placeholder="e.g. Lunch at Canteen" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Amount (₹)</label>
                    <input type="number" placeholder="0.00" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all" />
                  </div>
                  <button className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all">
                    Add Expense
                  </button>
                </div>
              </Card>
            </div>
          </div>
        );

      case 'admin':
        return (
          <div className="space-y-6">
            <header>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Panel</h1>
              <p className="text-slate-500 text-sm">Authorized access for campus administrators.</p>
            </header>
            {!isAdminLoggedIn ? (
              <div className="max-w-md mx-auto mt-12">
                <Card title="Faculty Login" icon={UserCircle}>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Faculty ID</label>
                      <input 
                        type="text" 
                        value={adminUser}
                        onChange={(e) => setAdminUser(e.target.value)}
                        placeholder="e.g. PROF01" 
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Password</label>
                      <input 
                        type="password" 
                        value={adminPass}
                        onChange={(e) => setAdminPass(e.target.value)}
                        placeholder="••••••••" 
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all" 
                      />
                    </div>
                    <button 
                      onClick={handleAdminLogin}
                      className="w-full py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all"
                    >
                      Login as Faculty
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-4">Demo: PROF01 / admin123</p>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-bold">PS</div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Prof. Sharma</h3>
                      <p className="text-xs text-slate-500">Department of Computer Science</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsAdminLoggedIn(false)}
                    className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    Logout
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="Post Notice" icon={Send}>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Subject</label>
                        <input type="text" placeholder="e.g. Class Rescheduled" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Message</label>
                        <textarea rows={3} placeholder="Enter notice details..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all resize-none" />
                      </div>
                      <button className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all">
                        Broadcast to Students
                      </button>
                    </div>
                  </Card>
                  <Card title="Pending Safety Reports" icon={ShieldAlert}>
                    <div className="space-y-4">
                      <div className="p-3 rounded-xl border border-rose-100 bg-rose-50">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-rose-900">CS-2024-4821 · Physical harassment</h4>
                          <Badge variant="error">High</Badge>
                        </div>
                        <p className="text-[10px] text-rose-700 mt-1 line-clamp-2">Seniors forced junior to do tasks late at night and threatened him.</p>
                        <button className="mt-3 text-[10px] font-bold text-rose-600 hover:underline">View Details & Take Action</button>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        );

      case 'timetable':
        return (
          <div className="space-y-6">
            <header>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Timetable & Attendance</h1>
              <p className="text-slate-500 text-sm">Track your progress and upcoming classes.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card title="Weekly Schedule" icon={Calendar}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time</th>
                          <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mon</th>
                          <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tue</th>
                          <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wed</th>
                          <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thu</th>
                          <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fri</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {[
                          { time: '09:00', mon: 'DS', tue: 'DBMS', wed: 'OS', thu: 'CN', fri: 'WT' },
                          { time: '11:00', mon: 'DBMS', tue: 'OS', wed: 'CN', thu: 'WT', fri: 'DS' },
                          { time: '14:00', mon: 'Lab', tue: 'Lab', wed: 'Lab', thu: 'Lab', fri: 'Lab' },
                        ].map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 font-bold text-slate-400">{row.time}</td>
                            <td className="py-4 text-slate-700 font-medium">{row.mon}</td>
                            <td className="py-4 text-slate-700 font-medium">{row.tue}</td>
                            <td className="py-4 text-slate-700 font-medium">{row.wed}</td>
                            <td className="py-4 text-slate-700 font-medium">{row.thu}</td>
                            <td className="py-4 text-slate-700 font-medium">{row.fri}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card title="Subject Attendance" icon={TrendingUp}>
                  <div className="space-y-5">
                    {SUBJECT_ATTENDANCE.map((s, idx) => {
                      const pct = Math.round((s.present / s.total) * 100);
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700">{s.name}</span>
                            <span className={cn("text-xs font-bold", pct < 75 ? "text-rose-600" : "text-emerald-600")}>
                              {pct}%
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, delay: idx * 0.1 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: s.color }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>{s.present} / {s.total} classes</span>
                            {pct < 75 && <span>Need 2 more</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <header>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Profile</h1>
              <p className="text-slate-500 text-sm">Manage your personal information and campus identity.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card className="text-center">
                  <div className="relative inline-block mb-4">
                    <img src={user.avatar} alt="Profile" className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-xl mx-auto" />
                    <button 
                      onClick={() => setUser({...user, avatar: `https://picsum.photos/seed/${Math.random()}/200`})}
                      className="absolute -bottom-2 -right-2 bg-indigo-600 p-2 rounded-xl text-white shadow-lg hover:bg-indigo-700 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
                  <p className="text-xs text-slate-500 mb-4">{user.roll} • {user.dept}</p>
                  <div className="flex justify-center gap-2">
                    <Badge variant="purple">{user.year}</Badge>
                    <Badge variant="info">{user.sem}</Badge>
                  </div>
                </Card>
              </div>
              <div className="md:col-span-2">
                <Card title="Edit Information" icon={UserCircle}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                        <input 
                          type="text" 
                          value={user.name}
                          onChange={(e) => setUser({...user, name: e.target.value})}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Email</label>
                        <input 
                          type="email" 
                          value={user.email}
                          onChange={(e) => setUser({...user, email: e.target.value})}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Department</label>
                      <select 
                        value={user.dept}
                        onChange={(e) => setUser({...user, dept: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all"
                      >
                        <option>Information Technology</option>
                        <option>Computer Science</option>
                        <option>Electronics</option>
                        <option>Mechanical</option>
                      </select>
                    </div>
                    <button className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all">
                      Save Changes
                    </button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Coming Soon</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">SmartCampus</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="h-full flex flex-col">
            <div className="p-6 hidden lg:flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">SmartCampus</span>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as Tab);
                    setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group",
                    activeTab === item.id 
                      ? "bg-indigo-50 text-indigo-700" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors",
                    activeTab === item.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  {item.label}
                  {activeTab === item.id && (
                    <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  )}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-100">
              <button 
                onClick={() => setActiveTab('profile')}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-2xl transition-all group",
                  activeTab === 'profile' ? "bg-indigo-50 border border-indigo-100" : "bg-slate-50 border border-slate-100 hover:bg-slate-100"
                )}
              >
                <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-xl object-cover border border-indigo-100 shadow-sm" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.dept}</p>
                </div>
                <div className="p-2 text-slate-400 group-hover:text-rose-600 transition-colors" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>
                  <LogOut className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-hidden">
          <div className="h-full overflow-y-auto p-4 md:p-8 lg:p-10 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
