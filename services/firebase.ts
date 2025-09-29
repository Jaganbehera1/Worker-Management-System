import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Employee, AttendanceRecord, Advance, SalaryPayment } from '../src/types';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Collections
export const employeesCollection = collection(db, 'employees');
export const attendanceCollection = collection(db, 'attendance');
export const advancesCollection = collection(db, 'advances');
export const salaryPaymentsCollection = collection(db, 'salaryPayments');

// Employee operations
export const addEmployee = async (employee: Omit<Employee, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(employeesCollection, {
    ...employee,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const deleteEmployee = async (id: string) => {
  await deleteDoc(doc(db, 'employees', id));
};

// Attendance operations
export const addAttendance = async (attendance: Omit<AttendanceRecord, 'id'>) => {
  const docRef = await addDoc(attendanceCollection, attendance);
  return docRef.id;
};

// Advance operations
export const addAdvance = async (advance: Omit<Advance, 'id'>) => {
  const docRef = await addDoc(advancesCollection, advance);
  return docRef.id;
};

export const deleteAdvance = async (id: string) => {
  await deleteDoc(doc(db, 'advances', id));
};

// Salary Payment operations
export const addSalaryPayment = async (payment: Omit<SalaryPayment, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(salaryPaymentsCollection, {
    ...payment,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const getSalaryPaymentsByWeek = async (weekStart: string) => {
  const q = query(
    salaryPaymentsCollection, 
    where('weekStart', '==', weekStart)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as SalaryPayment[];
};

// Real-time listeners
export const onEmployeesUpdate = (callback: (employees: Employee[]) => void) => {
  return onSnapshot(employeesCollection, (snapshot) => {
    const employees = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Employee[];
    callback(employees);
  });
};

export const onAttendanceUpdate = (callback: (attendance: AttendanceRecord[]) => void) => {
  return onSnapshot(attendanceCollection, (snapshot) => {
    const attendance = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AttendanceRecord[];
    callback(attendance);
  });
};

export const onAdvancesUpdate = (callback: (advances: Advance[]) => void) => {
  return onSnapshot(advancesCollection, (snapshot) => {
    const advances = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Advance[];
    callback(advances);
  });
};

export const onSalaryPaymentsUpdate = (callback: (payments: SalaryPayment[]) => void) => {
  return onSnapshot(salaryPaymentsCollection, (snapshot) => {
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SalaryPayment[];
    callback(payments);
  });
};