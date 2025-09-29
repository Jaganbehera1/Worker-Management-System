import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Employee } from '../types';
import { formatCurrency } from '../utils/dateUtils';

// Define extended report interface
interface ExtendedMonthlyReport {
  employeeId: string;
  month: string;
  totalDaysWorked: number;
  baseWages: number;
  additionalEarnings: number;
  totalWagesEarned: number;
  totalAdvancesTaken: number;
  totalSalaryPaid: number;
  finalAmount: number;
  otRecords: any[];
  halfDayRecords: any[];
  customPaymentRecords: any[];
}

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottom: '2pt solid #1e40af',
    paddingBottom: 15,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  companyLogo: {
    width: 40,
    height: 40,
    backgroundColor: '#1e40af',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyText: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  companyAddress: {
    fontSize: 8,
    color: '#64748b',
  },
  payslipTitle: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  period: {
    fontSize: 12,
    color: '#475569',
    marginTop: 5,
  },
  generatedDate: {
    fontSize: 8,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
    borderBottom: '1pt solid #e2e8f0',
    paddingBottom: 5,
  },
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    width: '48%',
  },
  employeeCard: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 5,
    border: '1pt solid #e2e8f0',
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  employeeDetail: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    width: '24%',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 8,
    textAlign: 'center',
  },
  breakdown: {
    marginBottom: 15,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottom: '0.5pt solid #f1f5f9',
  },
  rowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    borderRadius: 3,
    marginTop: 5,
  },
  label: {
    fontSize: 10,
    color: '#475569',
    flex: 2,
  },
  subLabel: {
    fontSize: 8,
    color: '#64748b',
  },
  amount: {
    fontSize: 10,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  positive: {
    color: '#059669',
  },
  negative: {
    color: '#dc2626',
  },
  neutral: {
    color: '#475569',
  },
  finalAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    padding: 15,
    borderRadius: 5,
    border: '1pt solid #1e40af',
    marginTop: 20,
  },
  finalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  finalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTop: '1pt solid #cbd5e1',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
  },
});

interface ProfessionalPayslipPDFProps {
  employee: Employee;
  report: ExtendedMonthlyReport;
}

const ProfessionalPayslipPDF: React.FC<ProfessionalPayslipPDFProps> = ({ employee, report }) => {
  const getMonthYear = (monthString: string) => {
    return new Date(monthString + '-01').toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric'
    });
  };

  const formatBalance = (balance: number) => {
    if (balance === 0) return formatCurrency(0);
    if (balance > 0) return `+${formatCurrency(balance)}`;
    return `-${formatCurrency(Math.abs(balance))}`;
  };

  const getFinalAmountColor = () => {
    if (report.finalAmount === 0) return styles.positive;
    if (report.finalAmount > 0) return styles.positive;
    return styles.negative;
  };

  const getFinalAmountText = () => {
    if (report.finalAmount === 0) return 'Fully Paid';
    if (report.finalAmount > 0) return 'Balance Due to Employee';
    return 'Overpaid - Adjust in next month';
  };

  const getStatCardStyle = (index: number) => {
    const colors = [
      { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' }, // blue
      { bg: '#dcfce7', text: '#166534', border: '#86efac' }, // green
      { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' }, // amber
      { bg: '#fce7f3', text: '#be185d', border: '#f9a8d4' }, // pink
    ];
    return {
      backgroundColor: colors[index].bg,
      border: `1pt solid ${colors[index].border}`,
    };
  };

  const statCardStyles = [
    { backgroundColor: '#dbeafe', color: '#1e40af' },
    { backgroundColor: '#dcfce7', color: '#166534' },
    { backgroundColor: '#fef3c7', color: '#92400e' },
    { backgroundColor: '#fce7f3', color: '#be185d' },
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <View style={styles.companyLogo}>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>JC</Text>
            </View>
            <View style={styles.companyText}>
              <Text style={styles.companyName}>JAGAN CONSTRUCTION</Text>
              <Text style={styles.companyAddress}>Construction Site Office, Main Road, City, State</Text>
            </View>
          </View>
          <View style={styles.payslipTitle}>
            <Text style={styles.title}>PAYSLIP</Text>
            <Text style={styles.period}>{getMonthYear(report.month)}</Text>
            <Text style={styles.generatedDate}>
              Generated on: {new Date().toLocaleDateString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Employee & Company Info */}
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Employee Details</Text>
            <View style={styles.employeeCard}>
              <Text style={styles.employeeName}>{employee.name}</Text>
              <Text style={styles.employeeDetail}>Designation: {employee.designation}</Text>
              <Text style={styles.employeeDetail}>Contact: {employee.contactNumber}</Text>
              <Text style={styles.employeeDetail}>Daily Wage: {formatCurrency(employee.dailyWage)}</Text>
            </View>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Company Details</Text>
            <View style={styles.employeeCard}>
              <Text style={styles.employeeDetail}>Jagan Construction</Text>
              <Text style={styles.employeeDetail}>Construction Site Office</Text>
              <Text style={styles.employeeDetail}>Main Road, City, State</Text>
              <Text style={styles.employeeDetail}>Phone: +91 XXXXX XXXXX</Text>
              <Text style={styles.employeeDetail}>Email: contact@jaganconstruction.com</Text>
            </View>
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Days Worked', value: report.totalDaysWorked.toString(), index: 0 },
            { label: 'Total Earnings', value: formatCurrency(report.totalWagesEarned), index: 1 },
            { label: 'Advances', value: formatCurrency(report.totalAdvancesTaken), index: 2 },
            { label: 'Net Amount', value: formatBalance(report.finalAmount), index: 3 },
          ].map((stat, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: statCardStyles[stat.index].backgroundColor }]}>
              <Text style={[styles.statValue, { color: statCardStyles[stat.index].color }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: statCardStyles[stat.index].color }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Earnings Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          <View style={styles.breakdown}>
            {/* Base Wages */}
            <View style={styles.row}>
              <View>
                <Text style={styles.label}>Basic Wages</Text>
                <Text style={styles.subLabel}>
                  {report.totalDaysWorked} days × {formatCurrency(employee.dailyWage)}
                </Text>
              </View>
              <Text style={[styles.amount, styles.positive]}>
                +{formatCurrency(report.baseWages)}
              </Text>
            </View>

            {/* Additional Earnings */}
            {report.additionalEarnings > 0 && (
              <>
                {report.otRecords.length > 0 && (
                  <View style={styles.row}>
                    <View>
                      <Text style={styles.label}>Overtime Payments</Text>
                      <Text style={styles.subLabel}>
                        {report.otRecords.length} days
                      </Text>
                    </View>
                    <Text style={[styles.amount, styles.positive]}>
                      +{formatCurrency(report.otRecords.reduce((sum, record) => sum + (record.customAmount || 0), 0))}
                    </Text>
                  </View>
                )}

                {report.halfDayRecords.length > 0 && (
                  <View style={styles.row}>
                    <View>
                      <Text style={styles.label}>Half Day Payments</Text>
                      <Text style={styles.subLabel}>
                        {report.halfDayRecords.length} days
                      </Text>
                    </View>
                    <Text style={[styles.amount, styles.positive]}>
                      +{formatCurrency(report.halfDayRecords.reduce((sum, record) => sum + (record.customAmount || 0), 0))}
                    </Text>
                  </View>
                )}

                {report.customPaymentRecords.length > 0 && (
                  <View style={styles.row}>
                    <View>
                      <Text style={styles.label}>Custom Payments</Text>
                      <Text style={styles.subLabel}>
                        {report.customPaymentRecords.length} entries
                      </Text>
                    </View>
                    <Text style={[styles.amount, styles.positive]}>
                      +{formatCurrency(report.customPaymentRecords.reduce((sum, record) => sum + (record.customAmount || 0), 0))}
                    </Text>
                  </View>
                )}

                <View style={styles.row}>
                  <Text style={[styles.label, { fontWeight: 'bold' }]}>Additional Earnings Total</Text>
                  <Text style={[styles.amount, styles.positive, { fontWeight: 'bold' }]}>
                    +{formatCurrency(report.additionalEarnings)}
                  </Text>
                </View>
              </>
            )}

            {/* Total Earnings */}
            <View style={styles.rowTotal}>
              <Text style={[styles.label, { fontWeight: 'bold', fontSize: 12 }]}>TOTAL EARNINGS</Text>
              <Text style={[styles.amount, styles.positive, { fontSize: 12, fontWeight: 'bold' }]}>
                +{formatCurrency(report.totalWagesEarned)}
              </Text>
            </View>
          </View>
        </View>

        {/* Deductions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deductions</Text>
          <View style={styles.breakdown}>
            <View style={styles.row}>
              <Text style={styles.label}>Advances Taken</Text>
              <Text style={[styles.amount, styles.negative]}>
                -{formatCurrency(report.totalAdvancesTaken)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Salary Already Paid</Text>
              <Text style={[styles.amount, styles.negative]}>
                -{formatCurrency(report.totalSalaryPaid)}
              </Text>
            </View>
            <View style={styles.rowTotal}>
              <Text style={[styles.label, { fontWeight: 'bold', fontSize: 12 }]}>TOTAL DEDUCTIONS</Text>
              <Text style={[styles.amount, styles.negative, { fontSize: 12, fontWeight: 'bold' }]}>
                -{formatCurrency(report.totalAdvancesTaken + report.totalSalaryPaid)}
              </Text>
            </View>
          </View>
        </View>

        {/* Final Amount */}
        <View style={styles.finalAmount}>
          <View>
            <Text style={styles.finalLabel}>NET PAYABLE AMOUNT</Text>
            <Text style={[styles.finalLabel, { fontSize: 10, fontWeight: 'normal' }]}>
              {getFinalAmountText()}
            </Text>
          </View>
          <Text style={[styles.finalValue, getFinalAmountColor()]}>
            {formatBalance(report.finalAmount)}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a computer-generated payslip and does not require a signature.
          </Text>
          <Text style={styles.footerText}>
            For any queries, please contact +91 XXXXX XXXXX or contact@jaganconstruction.com
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ProfessionalPayslipPDF;