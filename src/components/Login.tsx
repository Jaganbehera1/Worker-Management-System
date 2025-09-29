import React, { useState, useEffect } from 'react';
import { User, Lock, Building2, Eye, EyeOff, Mail, Users, Plus, X, Shield } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../config/firebase'; // You'll need to create this config file

interface LoginProps {
  onLogin: (role: 'admin' | 'viewer', userData?: any) => void;
}

interface ViewerAccount {
  email: string;
  password?: string; // Not stored in Firebase for security
  role: 'viewer';
  createdAt: Date;
  createdBy: string;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showViewerCreation, setShowViewerCreation] = useState(false);
  const [adminAccessCode, setAdminAccessCode] = useState('');
  const [newViewerAccount, setNewViewerAccount] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [adminCode, setAdminCode] = useState('');
  const [creationSuccess, setCreationSuccess] = useState(false);

  // Load admin access code from Firebase on component mount
  useEffect(() => {
    const loadAdminCode = async () => {
      try {
        const docRef = doc(db, 'config', 'adminAccess');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setAdminCode(docSnap.data().code);
        } else {
          // Set default admin code if not exists
          const defaultCode = '';
          await setDoc(docRef, { code: defaultCode });
          setAdminCode(defaultCode);
        }
      } catch (error) {
        console.error('Error loading admin code:', error);
        setError('Failed to load configuration');
      }
    };

    loadAdminCode();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );
      
      const user = userCredential.user;

      // Check user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        onLogin(userData.role, userData);
      } else {
        // If user doesn't exist in Firestore, check if it's the main admin
        if (credentials.email === 'jagan@gmail.com') {
          // Create admin user in Firestore
          await setDoc(doc(db, 'users', user.uid), {
            email: credentials.email,
            role: 'admin',
            createdAt: new Date(),
            name: 'Jagan Admin'
          });
          onLogin('admin', { email: credentials.email, role: 'admin' });
        } else {
          setError('User not found. Please contact administrator.');
          await signOut(auth);
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateViewerAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Verify admin access code
      if (adminAccessCode !== adminCode) {
        setError('Invalid admin access code');
        return;
      }

      // Validate email
      if (!newViewerAccount.email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }

      // Validate password
      if (newViewerAccount.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      // Check password match
      if (newViewerAccount.password !== newViewerAccount.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // Check if email already exists in Firebase Auth
      try {
        // Try to create the user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          newViewerAccount.email,
          newViewerAccount.password
        );

        const user = userCredential.user;

        // Store user role in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: newViewerAccount.email,
          role: 'viewer',
          createdAt: new Date(),
          createdBy: 'system',
          permissions: {
            canView: true,
            canEdit: false,
            canDelete: false,
            canCreate: false
          }
        });

        setCreationSuccess(true);
        
        // Reset form
        setNewViewerAccount({
          email: '',
          password: '',
          confirmPassword: ''
        });
        setAdminAccessCode('');
        
        // Sign out the newly created user (they'll sign in properly later)
        await signOut(auth);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setCreationSuccess(false);
          setShowViewerCreation(false);
        }, 3000);

      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          setError('A viewer account with this email already exists');
        } else {
          setError('Failed to create viewer account: ' + error.message);
        }
      }

    } catch (error: any) {
      setError('Error creating viewer account: ' + error.message);
    }
  };

  // Function to initialize admin user (run once)
  const initializeAdminUser = async () => {
    try {
      // Check if admin user already exists
      const adminQuery = query(
        collection(db, 'users'), 
        where('email', '==', 'jagan@gmail.com')
      );
      const querySnapshot = await getDocs(adminQuery);
      
      if (querySnapshot.empty) {
        // Create admin user in Firestore (the actual auth user will be created when they first login)
        await setDoc(doc(db, 'users', 'admin-user'), {
          email: 'jagan@gmail.com',
          role: 'admin',
          createdAt: new Date(),
          name: 'Jagan Admin',
          permissions: {
            canView: true,
            canEdit: true,
            canDelete: true,
            canCreate: true
          }
        });
        console.log('Admin user initialized in Firestore');
      }
    } catch (error) {
      console.error('Error initializing admin user:', error);
    }
  };

  // Initialize admin user on component mount
  useEffect(() => {
    initializeAdminUser();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleNewViewerInputChange = (field: string, value: string) => {
    setNewViewerAccount(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  return (
    <div className="min-h-screen gradient-bg-animated p-4 overflow-hidden relative">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-white rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-blue-200 rounded-full opacity-20 floating" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-cyan-200 rounded-full opacity-15 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-3/4 right-1/3 w-28 h-28 bg-indigo-200 rounded-full opacity-15 floating" style={{animationDelay: '1.5s'}}></div>
      </div>

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${(i + 1) * 10}%`,
              animationDelay: `${i * 0.8}s`
            }}
          ></div>
        ))}
      </div>

      {/* Main Form Container */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass-effect rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10 transform transition-all duration-300 hover:scale-[1.01] scroll-container">

          {/* Logo & Header */}
          <div className="text-center mb-8 floating">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Building2 className="text-white w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-white text-opacity-80 text-lg">Sign in to Jagan Construction</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && !showViewerCreation && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="text-white text-opacity-60 w-5 h-5 group-focus-within:text-blue-300 transition-colors duration-200" />
              </div>
              <input
                type="email"
                name="email"
                required
                value={credentials.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="input-glass w-full pl-10 pr-4 py-4 rounded-lg text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="text-white text-opacity-60 w-5 h-5 group-focus-within:text-blue-300 transition-colors duration-200" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={credentials.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="input-glass w-full pl-10 pr-12 py-4 rounded-lg text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-white text-opacity-60 hover:text-white text-opacity-80 transition-colors duration-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-blue-600 py-4 px-4 rounded-lg font-semibold btn-glow flex items-center justify-center transition-all duration-300 hover:scale-[1.02] disabled:scale-100 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                  Signing In...
                </>
              ) : (
                <>
                  <User className="w-5 h-5 mr-3" />
                  Sign In to Dashboard
                </>
              )}
            </button>
          </form>

          {/* Create Viewer Account Button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowViewerCreation(true)}
              className="text-white text-opacity-80 hover:text-white transition-colors duration-200 flex items-center justify-center mx-auto"
            >
              <Users className="w-4 h-4 mr-2" />
              Create Viewer Account
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center pt-5 border-t border-white border-opacity-10">
            <p className="text-white text-opacity-60 text-sm">
              © 2025 Jagan Construction. Secure Workforce Management
            </p>
          </div>
        </div>
      </div>

      {/* Viewer Account Creation Modal */}
      {showViewerCreation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="glass-effect rounded-3xl shadow-2xl p-8 w-full max-w-md relative transform transition-all duration-300">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowViewerCreation(false);
                setError('');
                setAdminAccessCode('');
                setNewViewerAccount({
                  email: '',
                  password: '',
                  confirmPassword: ''
                });
              }}
              className="absolute top-4 right-4 text-white text-opacity-60 hover:text-white transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Success Message */}
            {creationSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                Viewer account created successfully! You can now login with these credentials.
              </div>
            )}

            <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Viewer Account</h2>

            <form onSubmit={handleCreateViewerAccount} className="space-y-6">
              {error && showViewerCreation && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                  {error}
                </div>
              )}

              {/* Admin Access Code */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="text-white text-opacity-60 w-5 h-5 group-focus-within:text-blue-300 transition-colors duration-200" />
                </div>
                <input
                  type="password"
                  required
                  value={adminAccessCode}
                  onChange={(e) => setAdminAccessCode(e.target.value)}
                  className="input-glass w-full pl-10 pr-4 py-4 rounded-lg text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                  placeholder="Enter Admin Access Code"
                />
              </div>

              {/* New Viewer Email */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-white text-opacity-60 w-5 h-5 group-focus-within:text-blue-300 transition-colors duration-200" />
                </div>
                <input
                  type="email"
                  required
                  value={newViewerAccount.email}
                  onChange={(e) => handleNewViewerInputChange('email', e.target.value)}
                  className="input-glass w-full pl-10 pr-4 py-4 rounded-lg text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                  placeholder="Viewer Email Address"
                />
              </div>

              {/* New Viewer Password */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-white text-opacity-60 w-5 h-5 group-focus-within:text-blue-300 transition-colors duration-200" />
                </div>
                <input
                  type="password"
                  required
                  value={newViewerAccount.password}
                  onChange={(e) => handleNewViewerInputChange('password', e.target.value)}
                  className="input-glass w-full pl-10 pr-4 py-4 rounded-lg text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                  placeholder="Viewer Password (min. 6 characters)"
                />
              </div>

              {/* Confirm Password */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-white text-opacity-60 w-5 h-5 group-focus-within:text-blue-300 transition-colors duration-200" />
                </div>
                <input
                  type="password"
                  required
                  value={newViewerAccount.confirmPassword}
                  onChange={(e) => handleNewViewerInputChange('confirmPassword', e.target.value)}
                  className="input-glass w-full pl-10 pr-4 py-4 rounded-lg text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                  placeholder="Confirm Password"
                />
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 px-4 rounded-lg font-semibold btn-glow flex items-center justify-center transition-all duration-300 hover:scale-[1.02]"
              >
                <Plus className="w-5 h-5 mr-3" />
                Create Viewer Account
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-500 bg-opacity-20 rounded-lg border border-blue-500 border-opacity-30">
              <p className="text-blue-200 text-sm text-center">
                <strong>Note:</strong> Viewer accounts can only view data. All editing features are disabled.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;